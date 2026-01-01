import Stripe from "stripe";

import { env } from "@/env.mjs";
import { supabaseAdmin } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error: any) {
    logger.error(`Webhook Error: ${error.message}`, error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  logger.info(`Processing Stripe webhook event: ${event.type}`);

  // Log full event data for debugging
  try {
    logger.debug("Event data", { eventData: event.data.object });
  } catch (e) {
    logger.debug("Could not stringify event data for logging");
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      logger.info(
        `Checkout session completed for user: ${session?.metadata?.userId}`,
      );

      if (!session?.metadata?.userId) {
        logger.error("No userId in session metadata");
        return new Response("Missing userId in session metadata", {
          status: 400,
        });
      }

      // Retrieve the subscription details from Stripe.
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );

      logger.info(
        `Retrieved subscription: ${subscription.id} for customer: ${subscription.customer}`,
      );
      logger.debug(`Price ID: ${subscription.items.data[0].price.id}`);

      // Verify the users table exists
      const { data: tableCheck, error: tableError } = await supabaseAdmin.rpc(
        "describe_table",
        { table_name: "users" },
      );

      if (tableError || !tableCheck || tableCheck.length === 0) {
        logger.error("Users table does not exist", tableError);
        // Try to create the table if it doesn't exist
        await createUsersTableIfNeeded();
      }

      // Check if user exists by ID first
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("id", session.metadata.userId)
        .single();

      if (userError || !userData) {
        logger.error(
          `User ${session.metadata.userId} not found by ID`,
          userError,
        );

        // If user not found by ID, try to find by email
        if (session.customer_email) {
          logger.info(`Looking for user by email: ${session.customer_email}`);
          const { data: emailUserData, error: emailUserError } =
            await supabaseAdmin
              .from("users")
              .select("id, email")
              .eq("email", session.customer_email)
              .single();

          if (emailUserData && !emailUserError) {
            logger.info(`Found user by email with ID: ${emailUserData.id}`);

            // Update subscription for existing user found by email
            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer as string,
                stripe_price_id: subscription.items.data[0].price.id,
                stripe_current_period_end: new Date(
                  subscription.current_period_end * 1000,
                ).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", emailUserData.id);

            if (updateError) {
              logger.error("Error updating user found by email", updateError);
              return new Response(`Database Error: ${updateError.message}`, {
                status: 500,
              });
            }

            logger.info(
              `Updated subscription for user found by email: ${emailUserData.id}`,
            );
            return new Response(null, { status: 200 });
          }

          // User not found by ID or email, create new user
          logger.info(
            `Creating new user with ID ${session.metadata.userId} and email ${session.customer_email}`,
          );
          const { error: insertError } = await supabaseAdmin
            .from("users")
            .insert({
              id: session.metadata.userId,
              email: session.customer_email,
              name: session.customer_email.split("@")[0],
              role: "USER",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0].price.id,
              stripe_current_period_end: new Date(
                subscription.current_period_end * 1000,
              ).toISOString(),
            });

          if (insertError) {
            logger.error("Error creating user record", insertError);
            return new Response(`Database Error: ${insertError.message}`, {
              status: 500,
            });
          }

          logger.info(`Created new user record for ${session.metadata.userId}`);
          return new Response(null, { status: 200 });
        } else {
          logger.error("No customer email in checkout session");
          return new Response("Missing customer email in session", {
            status: 400,
          });
        }
      }

      // User exists, update subscription data
      logger.info(`Updating subscription for existing user ${userData.id}`);
      const { error } = await supabaseAdmin
        .from("users")
        .update({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          stripe_price_id: subscription.items.data[0].price.id,
          stripe_current_period_end: new Date(
            subscription.current_period_end * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.metadata.userId);

      if (error) {
        logger.error("Error updating user after checkout completion", error);
        return new Response(`Database Error: ${error.message}`, {
          status: 500,
        });
      }

      logger.info(
        `Successfully updated subscription for user ${session.metadata.userId}`,
      );
      logger.debug(`Updated price ID: ${subscription.items.data[0].price.id}`);
      logger.debug(
        `Updated period end: ${new Date(subscription.current_period_end * 1000).toISOString()}`,
      );

      // Create subscription notification
      try {
        const { createSubscriptionNotification } = await import("@/lib/notifications");
        const planName = subscription.items.data[0].price.nickname || "Premium";
        await createSubscriptionNotification({
          userId: session.metadata.userId,
          action: "created",
          planName,
        });
      } catch (notificationError) {
        logger.error("Failed to create subscription notification", notificationError);
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      logger.info(
        `Invoice payment succeeded for subscription: ${invoice.subscription}`,
      );

      // If the billing reason is not subscription_create, it means the customer has updated their subscription.
      // If it is subscription_create, we don't need to update the subscription id and it will handle by the checkout.session.completed event.
      if (invoice.billing_reason !== "subscription_create") {
        // Retrieve the subscription details from Stripe.
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string,
        );

        logger.info(`Retrieved subscription details for: ${subscription.id}`);
        logger.debug(`Price ID: ${subscription.items.data[0].price.id}`);

        // Retrieve customer ID to find user if needed
        const customerId = subscription.customer as string;

        // First try to update by subscription ID
        const { data: userData, error: userError } = await supabaseAdmin
          .from("users")
          .update({
            stripe_price_id: subscription.items.data[0].price.id,
            stripe_current_period_end: new Date(
              subscription.current_period_end * 1000,
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)
          .select("id");

        if (userError || !userData || userData.length === 0) {
          logger.info(
            `Could not find user by subscription ID, trying customer ID: ${customerId}`,
          );

          // If we can't find by subscription ID, try to find by customer ID
          const { error: customerUpdateError } = await supabaseAdmin
            .from("users")
            .update({
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0].price.id,
              stripe_current_period_end: new Date(
                subscription.current_period_end * 1000,
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          if (customerUpdateError) {
            logger.error(
              "Error updating user by customer ID",
              customerUpdateError,
            );
            return new Response(
              `Database Error: ${customerUpdateError.message}`,
              { status: 500 },
            );
          }
        }

        logger.info("Successfully updated subscription information");
        logger.debug(`Updated price ID: ${subscription.items.data[0].price.id}`);
        logger.debug(
          `Updated period end: ${new Date(subscription.current_period_end * 1000).toISOString()}`,
        );

        // Create subscription renewal notification
        try {
          const { createSubscriptionNotification } = await import("@/lib/notifications");
          const userDataForNotification = userData && userData.length > 0 
            ? userData[0] 
            : await supabaseAdmin
                .from("users")
                .select("id")
                .eq("stripe_customer_id", customerId)
                .single()
                .then(({ data }) => data);
          
          if (userDataForNotification?.id) {
            const planName = subscription.items.data[0].price.nickname || "Premium";
            await createSubscriptionNotification({
              userId: userDataForNotification.id,
              action: "renewed",
              planName,
            });
          }
        } catch (notificationError) {
          logger.error("Failed to create subscription notification", notificationError);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      logger.info(`Subscription deleted for customer: ${customerId}`);

      // Get user ID before updating
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      // Update user record to remove subscription details
      const { error } = await supabaseAdmin
        .from("users")
        .update({
          stripe_subscription_id: null,
          stripe_price_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);

      if (error) {
        logger.error(
          "Error updating user after subscription deletion",
          error,
        );
        return new Response(`Database Error: ${error.message}`, {
          status: 500,
        });
      }

      logger.info("Successfully removed subscription information");

      // Create subscription cancellation notification
      if (userData?.id) {
        try {
          const { createSubscriptionNotification } = await import("@/lib/notifications");
          await createSubscriptionNotification({
            userId: userData.id,
            action: "cancelled",
          });
        } catch (notificationError) {
          logger.error("Failed to create subscription notification", notificationError);
        }
      }
    }

    return new Response(null, { status: 200 });
  } catch (error: any) {
    logger.error(`Error processing webhook: ${error.message}`, error);
    return new Response(`Server Error: ${error.message}`, { status: 500 });
  }
}

// Helper function to create users table if needed
async function createUsersTableIfNeeded() {
  try {
    // Try to create the users table with necessary columns
    const { error } = await supabaseAdmin.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY,
          email TEXT,
          name TEXT,
          role TEXT DEFAULT 'USER',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          stripe_price_id TEXT,
          stripe_current_period_end TIMESTAMPTZ
        );
      `,
    });

    if (error) {
      logger.error("Error creating users table", error);
      throw error;
    }

    logger.info("Users table created or already exists");
    return true;
  } catch (error) {
    logger.error("Failed to create users table", error);
    return false;
  }
}
