import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    if (!code) {
      return new NextResponse("QR-Code nicht gefunden", { status: 404 });
    }

    const supabase = await getSupabaseServer();
    
    // Find customer by QR code
    const { data: customer, error } = await supabase
      .from("customers")
      .select("id")
      .eq("qr_code", code)
      .single();

    if (error || !customer) {
      return new NextResponse("Kunde nicht gefunden", { status: 404 });
    }

    // Redirect to customer detail page
    return NextResponse.redirect(
      new URL(`/dashboard/customers/${customer.id}`, request.url)
    );
  } catch (error) {
    console.error("QR redirect error:", error);
    return new NextResponse("Fehler beim Verarbeiten des QR-Codes", {
      status: 500,
    });
  }
}


