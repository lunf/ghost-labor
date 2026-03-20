type MockRequest = {
  input: string;
  init?: RequestInit;
};

type MockHandler = (request: MockRequest) => Promise<Response> | Response;

export async function withMockedFetch<T>(args: {
  handler: MockHandler;
  run: (requests: MockRequest[]) => Promise<T>;
}) {
  const originalFetch = globalThis.fetch;
  const requests: MockRequest[] = [];

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const request = {
      input: url,
      init
    };

    requests.push(request);
    return args.handler(request);
  }) as typeof fetch;

  try {
    return await args.run(requests);
  } finally {
    globalThis.fetch = originalFetch;
  }
}
