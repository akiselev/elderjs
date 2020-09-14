import hooks from '../hooks';

jest.mock('../externalHelpers', () => () => Promise.resolve({ permalink: jest.fn() }));

process.cwd = () => 'test';

jest.mock('path', () => ({
  resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/'),
}));

jest.mock('fs-extra', () => ({
  writeJSONSync: jest.fn(),
  outputFileSync: jest
    .fn()
    .mockImplementationOnce(() => {})
    .mockImplementationOnce(() => {
      throw new Error('Failed to write');
    }),
}));

describe('#hooks', () => {
  it('has valid priority', () => {
    expect(hooks.filter((h) => h.priority < 1 && h.priority > 100)).toEqual([]);
  });
  it('matchesSnapshot', () => {
    expect(hooks).toMatchSnapshot();
  });
  it('elderAddExternalHelpers', async () => {
    expect(await hooks[0].run({ helpers: { old: jest.fn() }, query: {}, settings: {} })).toMatchSnapshot();
  });
  it('elderAddMetaCharsetToHead', async () => {
    expect(await hooks[1].run({ headStack: [] })).toMatchSnapshot();
  });
  it('elderAddMetaViewportToHead', async () => {
    expect(await hooks[2].run({ headStack: [] })).toMatchSnapshot();
  });
  it('elderAddDefaultIntersectionObserver', async () => {
    expect(
      await hooks[3].run({ beforeHydrateStack: [], settings: { locations: { intersectionObserverPoly: 'foo' } } }),
    ).toMatchSnapshot();
    expect(await hooks[3].run({ beforeHydrateStack: [], settings: {} })).toBe(null);
  });
  it('elderAddSystemJs', async () => {
    expect(
      await hooks[4].run({ beforeHydrateStack: [], headStack: [], settings: { locations: { systemJs: 'foo' } } }),
    ).toMatchSnapshot();
    expect(await hooks[4].run({ beforeHydrateStack: [], settings: {} })).toBe(null);
  });

  it('elderCreateHtmlString', async () => {
    expect(
      await hooks[5].run({
        request: { route: 'test' },
        headString: 'head',
        footerString: 'footer',
        layoutHtml: 'layout',
      }),
    ).toStrictEqual({
      htmlString: '<!DOCTYPE html><html lang="en"><head>head</head><body class="test">layoutfooter</body></html>',
    });
  });

  it('elderConsoleLogErrors', async () => {
    expect(await hooks[6].run({ errors: ['foo', 'bar'] })).toBe(undefined);
  });
  it('elderWriteHtmlFileToPublic', async () => {
    expect(
      await hooks[7].run({
        request: { permalink: '/foo' },
        htmlString: '<html>string</html>',
        errors: [],
        settings: {},
      }),
    ).toBe(null);
    expect(
      await hooks[7].run({
        request: { permalink: '/foo' },
        htmlString: '<html>string</html>',
        errors: [],
        settings: { build: './build', locations: { public: './public' } },
      }),
    ).toBe(null);
    expect(
      await hooks[7].run({
        request: { permalink: '/foo' },
        htmlString: '<html>string</html>',
        errors: [],
        settings: { build: './build', locations: { public: './public' } },
      }),
    ).toEqual({ errors: [new Error('Failed to write')] });
  });
  it('elderDisplayRequestTime', async () => {
    expect(
      await hooks[8].run({
        request: { permalink: '/foo' },
        timings: [
          { name: 'foo', duration: 500 },
          { name: 'bar', duration: 250 },
        ],
        settings: { debug: { performance: true } },
      }),
    ).toBe(undefined);
  });
  it('elderShowParsedBuildTimes', async () => {
    expect(
      await hooks[9].run({
        timings: [
          [
            { name: 'foo', duration: 500 },
            { name: 'bar', duration: 250 },
          ],
          [
            { name: 'foo', duration: 2500 },
            { name: 'bar', duration: 0 },
          ],
        ],
        settings: { debug: { performance: true } },
      }),
    ).toBe(undefined);
  });
  it('elderWriteBuildErrors', async () => {
    expect(
      await hooks[10].run({
        errors: ['error1', 'error2'],
        settings: { debug: { performance: true } },
      }),
    ).toBe(undefined);
  });
});
