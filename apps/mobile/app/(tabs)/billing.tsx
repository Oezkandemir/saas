import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Linking } from 'react-native';
import { useAuth } from '~/lib/auth-context';
import { getUserSubscriptionPlan, pricingData, UserSubscriptionPlan, SubscriptionPlan, formatDate } from '~/lib/billing-service';
import { H1, H2, H3, P, Muted } from '~/components/ui/typography';
// Simple native React Native components with proper dark/light mode support
const Card = ({ children, style, colorScheme, ...props }: any) => (
  <View 
    style={[
      {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? '#333333' : '#e5e5e5',
        backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
        shadowColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 16,
      },
      style
    ]} 
    {...props}
  >
    {children}
  </View>
);

const CardHeader = ({ children, style, ...props }: any) => (
  <View 
    style={[
      {
        padding: 16,
        paddingBottom: 8,
      },
      style
    ]} 
    {...props}
  >
    {children}
  </View>
);

const CardTitle = ({ children, style, colorScheme, ...props }: any) => (
  <Text 
    style={[
      {
        fontSize: 18,
        fontWeight: '600',
        color: colorScheme === 'dark' ? '#ffffff' : '#000000',
        marginBottom: 4,
      },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

const CardDescription = ({ children, style, colorScheme, ...props }: any) => (
  <Text 
    style={[
      {
        fontSize: 14,
        color: colorScheme === 'dark' ? '#cccccc' : '#666666',
      },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

const CardContent = ({ children, style, ...props }: any) => (
  <View 
    style={[
      {
        padding: 16,
        paddingTop: 0,
      },
      style
    ]} 
    {...props}
  >
    {children}
  </View>
);

const CardFooter = ({ children, style, ...props }: any) => (
  <View 
    style={[
      {
        padding: 16,
        paddingTop: 0,
        flexDirection: 'row',
        alignItems: 'center',
      },
      style
    ]} 
    {...props}
  >
    {children}
  </View>
);
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { cn } from '~/lib/utils';
import { useColorScheme } from '~/lib/useColorScheme';
import { Check } from '~/lib/icons/Check';
import { X } from '~/lib/icons/X';
import { MessageSquare as CreditCard } from '~/lib/icons/MessageSquare';
import { Search as RefreshCw } from '~/lib/icons/Search';
import { AlertTriangle } from '~/lib/icons/AlertTriangle';

export default function BillingScreen() {
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState<UserSubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isYearly, setIsYearly] = useState(true);

  useEffect(() => {
    loadSubscriptionPlan();
  }, [user]);

  const loadSubscriptionPlan = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const plan = await getUserSubscriptionPlan(user.id, user.email);
      setUserSubscriptionPlan(plan);
      // Set billing toggle based on current subscription
      if (plan.interval) {
        setIsYearly(plan.interval === 'year');
      }
    } catch (error) {
      console.error('Error loading subscription plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubscriptionPlan();
    setRefreshing(false);
  };

  const handleChoosePlan = (plan: SubscriptionPlan) => {
    // In a real app, this would navigate to Stripe checkout
    Alert.alert(
      'Choose Plan',
      `You selected the ${plan.title} plan. In a real app, this would redirect to Stripe checkout.`,
      [{ text: 'OK' }]
    );
  };

  const handleManageSubscription = () => {
    // In a real app, this would open the customer portal
    Alert.alert(
      'Manage Subscription',
      'In a real app, this would open the Stripe customer portal.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Portal', 
          onPress: () => Linking.openURL('https://billing.stripe.com/p/login/test_14kcMTbsj2hdbgQ288')
        }
      ]
    );
  };

  const PricingCard = ({ plan, isCurrentPlan }: { plan: SubscriptionPlan; isCurrentPlan: boolean }) => {
    const isPro = plan.title.toLowerCase() === 'pro';
    const price = isYearly ? plan.prices.yearly / 12 : plan.prices.monthly;
    const originalPrice = plan.prices.monthly;

    return (
      <Card 
        colorScheme={colorScheme}
        style={{
          borderWidth: isPro ? 2 : 1,
          borderColor: isPro ? '#a855f7' : (colorScheme === 'dark' ? '#333333' : '#e5e5e5'),
          backgroundColor: isCurrentPlan 
            ? (colorScheme === 'dark' ? '#111111' : '#f8f8f8')
            : (colorScheme === 'dark' ? '#000000' : '#ffffff')
        }}
      >
        <CardHeader style={{ paddingBottom: 12 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <CardTitle 
                colorScheme={colorScheme}
                style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  letterSpacing: 1, 
                  color: colorScheme === 'dark' ? '#cccccc' : '#666666'
                }}
              >
                {plan.title}
              </CardTitle>
              <CardDescription colorScheme={colorScheme} style={{ marginTop: 4 }}>
                {plan.description}
              </CardDescription>
            </View>
            {isCurrentPlan && (
              <Badge variant="secondary">
                <Text>Current Plan</Text>
              </Badge>
            )}
          </View>
          
          <View className="flex-row items-end">
            <View className="flex-row items-end">
              {isYearly && originalPrice > 0 && (
                <Muted className="mr-2 line-through">
                  ${originalPrice}
                </Muted>
              )}
              <H2 className="text-3xl font-semibold">
                ${price}
              </H2>
            </View>
            <Muted className="ml-2 mb-1">/month</Muted>
          </View>
          
          {plan.prices.monthly > 0 && (
            <Muted className="text-sm">
              {isYearly 
                ? `$${plan.prices.yearly} will be charged annually`
                : 'when charged monthly'
              }
            </Muted>
          )}
        </CardHeader>

        <CardContent style={{ paddingTop: 0 }}>
          <View className="space-y-2">
            {plan.benefits.map((benefit, index) => (
              <View key={index} className="flex-row items-start">
                <Check className="size-5 shrink-0 text-purple-500 mr-3 mt-0.5" />
                <P className="flex-1 text-sm">{benefit}</P>
              </View>
            ))}
            
            {plan.limitations.map((limitation, index) => (
              <View key={index} className="flex-row items-start">
                <X className="size-5 shrink-0 text-muted-foreground mr-3 mt-0.5" />
                <P className="flex-1 text-sm text-muted-foreground">{limitation}</P>
              </View>
            ))}
          </View>
        </CardContent>

        <CardFooter>
          {isCurrentPlan ? (
            userSubscriptionPlan?.isPaid ? (
              <Button
                variant="outline"
                className="w-full"
                onPress={handleManageSubscription}
              >
                <CreditCard className="size-4 mr-2" />
                <Text>Manage Subscription</Text>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onPress={() => {/* Navigate to dashboard */}}
              >
                <Text>Go to Dashboard</Text>
              </Button>
            )
          ) : (
            <Button
              variant={isPro ? "default" : "outline"}
              className="w-full"
              onPress={() => handleChoosePlan(plan)}
            >
              <Text>{user ? "Choose Plan" : "Sign In"}</Text>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={handleRefresh}
              disabled={refreshing}
              className="ml-auto"
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            </Button>
          </View>
          <Muted>
            Manage your subscription and billing preferences
          </Muted>
        </View>

        {/* Demo Alert */}
        <Card colorScheme={colorScheme} style={{ 
          borderColor: '#fbbf24', 
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fef3c7' 
        }}>
          <CardContent style={{ paddingTop: 16 }}>
            <View className="flex-row items-start">
              <AlertTriangle className="size-5 text-amber-600 mr-3 mt-0.5" />
              <View className="flex-1">
                <H3 className="text-amber-800 dark:text-amber-200 mb-2">
                  Demo Alert
                </H3>
                <P className="text-amber-700 dark:text-amber-300 text-sm">
                  This is a demo environment. You can test the subscriptions and won't be charged. 
                  See{' '}
                  <P 
                    className="font-medium underline text-amber-800 dark:text-amber-200"
                    onPress={() => Linking.openURL('https://stripe.com/docs/testing#cards')}
                  >
                    Stripe test cards
                  </P>
                  {' '}for testing.
                </P>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Current Subscription */}
        {userSubscriptionPlan && (
          <View className="mb-6">
            <H2 className="mb-4">Current Subscription</H2>
            <Card colorScheme={colorScheme}>
              <CardHeader>
                <CardTitle colorScheme={colorScheme}>Subscription Plan</CardTitle>
                <CardDescription colorScheme={colorScheme}>
                  You are currently on the <P className="font-semibold">{userSubscriptionPlan.title}</P> plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <P className="mb-4">{userSubscriptionPlan.description}</P>
                
                {userSubscriptionPlan.isPaid ? (
                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <Check className="size-4 text-green-500 mr-2" />
                      <P className="text-sm text-muted-foreground">Active subscription</P>
                    </View>
                    
                    <View className="mt-2 space-y-1">
                      <P className="text-sm">
                        <P className="font-semibold">Plan Type:</P> {userSubscriptionPlan.title}
                      </P>
                      <P className="text-sm">
                        <P className="font-semibold">Billing Cycle:</P>{' '}
                        {userSubscriptionPlan.interval === 'month' ? 'Monthly' : 'Yearly'}
                      </P>
                      {userSubscriptionPlan.stripePriceId && (
                        <P className="text-sm">
                          <P className="font-semibold">Price ID:</P> {userSubscriptionPlan.stripePriceId}
                        </P>
                      )}
                    </View>
                  </View>
                ) : (
                  <Card colorScheme={colorScheme} style={{ 
                    borderColor: '#fbbf24', 
                    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fef3c7' 
                  }}>
                    <CardContent style={{ paddingTop: 12 }}>
                      <View className="flex-row items-start">
                        <AlertTriangle className="size-5 text-amber-600 mr-3 mt-0.5" />
                        <View className="flex-1">
                          <H3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            No Active Subscription
                          </H3>
                          <P className="text-sm text-amber-700 dark:text-amber-300">
                            You're currently on the free plan. Upgrade to unlock more features.
                          </P>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
              
              {userSubscriptionPlan.isPaid && userSubscriptionPlan.stripeCurrentPeriodEnd && (
                <CardFooter style={{ 
                  borderTopWidth: 1, 
                  borderTopColor: colorScheme === 'dark' ? '#333333' : '#e5e5e5', 
                  backgroundColor: colorScheme === 'dark' ? '#111111' : '#f8f8f8', 
                  justifyContent: 'space-between' 
                }}>
                  <P className="text-sm font-medium text-muted-foreground">
                    {userSubscriptionPlan.isCanceled
                      ? 'Your plan will be canceled on '
                      : 'Your plan renews on '}
                    {formatDate(userSubscriptionPlan.stripeCurrentPeriodEnd)}
                  </P>
                </CardFooter>
              )}
            </Card>
          </View>
        )}

        {/* Billing Toggle */}
        <View className="mb-6">
          <H2 className="mb-4">Available Plans</H2>
          <View className="flex-row justify-center mb-4">
            <View className="flex-row bg-muted rounded-full p-1">
              <Button
                variant={isYearly ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-full px-5",
                  isYearly ? "bg-primary" : "bg-transparent"
                )}
                onPress={() => setIsYearly(true)}
              >
                <Text>Yearly (-20%)</Text>
              </Button>
              <Button
                variant={!isYearly ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-full px-5",
                  !isYearly ? "bg-primary" : "bg-transparent"
                )}
                onPress={() => setIsYearly(false)}
              >
                <Text>Monthly</Text>
              </Button>
            </View>
          </View>
        </View>

        {/* Pricing Cards */}
        <View className="space-y-4 mb-6">
          {pricingData.map((plan) => (
            <PricingCard
              key={plan.title}
              plan={plan}
              isCurrentPlan={userSubscriptionPlan?.title === plan.title}
            />
          ))}
        </View>

        {/* Support */}
        <Card colorScheme={colorScheme}>
          <CardContent style={{ paddingTop: 16 }}>
            <P className="text-center text-muted-foreground text-sm">
              Email{' '}
              <P 
                className="font-medium text-primary"
                onPress={() => Linking.openURL('mailto:support@saas-starter.com')}
              >
                support@saas-starter.com
              </P>
              {' '}to contact our support team.
            </P>
            <P className="text-center font-semibold text-sm mt-2">
              You can test the subscriptions and won't be charged.
            </P>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
} 