import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    const res = await fetch(`${API_URL}/api/orders/${orderId}/protocol/download`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!res.ok) {
      const contentType = res.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      if (isJson) {
        const data = await res.json();
        return NextResponse.json(
          {
            error: data.error || 'Failed to download protocol',
            message: data.message || 'Failed to download protocol',
          },
          { status: res.status }
        );
      }

      return NextResponse.json(
        { error: 'Failed to download protocol' },
        { status: res.status }
      );
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'application/pdf';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment; filename="order-protocol.pdf"',
        'Content-Length': buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}