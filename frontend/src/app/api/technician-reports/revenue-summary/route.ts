import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: from_date and to_date' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      from_date: fromDate,
      to_date: toDate,
    });

    const res = await fetch(`${API_URL}/api/technician-reports/revenue-summary?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const contentType = res.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const text = await res.text();

    if (!isJson) {
      console.error('Backend error - not JSON:', { status: res.status, text: text.substring(0, 500) });
      return NextResponse.json(
        { error: `Backend error: ${res.status}`, message: 'Backend returned invalid response' },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', { error: String(e), text: text.substring(0, 500) });
      return NextResponse.json(
        { error: 'Failed to parse response', message: 'Backend returned invalid JSON' },
        { status: 500 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch technician revenue summary' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
