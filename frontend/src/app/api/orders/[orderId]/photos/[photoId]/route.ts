import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; photoId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, photoId } = await params;

    const response = await fetch(`${API_URL}/api/orders/${orderId}/photos/${photoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!isJson) {
      const text = await response.text();
      console.error('Backend error - not JSON:', { status: response.status, text: text.substring(0, 500) });
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ success: true });
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
