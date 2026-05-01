import { NextRequest, NextResponse } from 'next/server'
import { getPizzaApiBaseUrl } from '@/lib/server/pizza-api-base'

export const dynamic = 'force-dynamic'

async function proxyToPizzaApi(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const base = getPizzaApiBaseUrl()
  const subpath = pathSegments.join('/')
  const search = request.nextUrl.search
  const url = `${base}/${subpath}${search}`

  const headers = new Headers()
  const auth = request.headers.get('authorization')
  if (auth) headers.set('authorization', auth)

  const incomingCt = request.headers.get('content-type')
  if (incomingCt) headers.set('content-type', incomingCt)

  const accept = request.headers.get('accept')
  if (accept) headers.set('accept', accept)

  const method = request.method
  const isMultipart = Boolean(incomingCt?.includes('multipart/form-data'))

  let body: BodyInit | undefined
  if (!['GET', 'HEAD'].includes(method)) {
    if (isMultipart) {
      const buf = await request.arrayBuffer()
      body = buf.byteLength ? buf : undefined
    } else {
      const text = await request.text()
      body = text === '' ? undefined : text
    }
  }

  const upstream = await fetch(url, {
    method,
    headers,
    body,
  })

  // 204/304 must not include a message body; forwarding "" as a body can confuse clients.
  if (upstream.status === 204 || upstream.status === 304) {
    return new NextResponse(null, { status: upstream.status })
  }

  const text = await upstream.text()
  const out = new NextResponse(text, { status: upstream.status })
  const outCt = upstream.headers.get('content-type')
  if (outCt) out.headers.set('content-type', outCt)
  return out
}

type Ctx = { params: Promise<{ path?: string[] }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params
  return proxyToPizzaApi(request, path ?? [])
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params
  return proxyToPizzaApi(request, path ?? [])
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params
  return proxyToPizzaApi(request, path ?? [])
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params
  return proxyToPizzaApi(request, path ?? [])
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params
  return proxyToPizzaApi(request, path ?? [])
}
