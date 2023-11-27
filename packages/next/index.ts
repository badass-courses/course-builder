import { NextRequest } from 'next/server'

import { createServerHandler, defaultErrorFormatter, UploadThingError } from './internal/server'
import {
  AnyParams,
  FileRouter,
  FileRouterInputConfig,
  Json,
  JsonParser,
  MaybePromise,
  MiddlewareFnArgs,
  RouterWithConfig,
  Simplify,
  UnsetMarker,
  Uploader,
} from './internal/types'

export type CreateBuilderOptions<TErrorShape extends Json> = {
  errorFormatter: (err: UploadThingError) => TErrorShape
}

export type ErrorMessage<TError extends string> = TError

type ResolverOptions<TParams extends AnyParams> = {
  metadata: Simplify<TParams['_metadata'] extends UnsetMarker ? undefined : TParams['_metadata']>
}

type ResolverFn<TParams extends AnyParams> = (opts: ResolverOptions<TParams>) => MaybePromise<void>

type UploadErrorFn = (input: { error: UploadThingError; fileKey: string }) => void

type MiddlewareFn<
  TInput extends JSON | UnsetMarker,
  TOutput extends Record<string, unknown>,
  TArgs extends MiddlewareFnArgs<any, any, any>,
> = (opts: TArgs & (TInput extends UnsetMarker ? {} : { input: TInput })) => MaybePromise<TOutput>

export interface UploadBuilder<TParams extends AnyParams> {
  input: <TParser extends JsonParser>(
    parser: TParams['_input'] extends UnsetMarker ? TParser : ErrorMessage<'input is already set'>,
  ) => UploadBuilder<{
    _input: TParser['_output']
    _metadata: TParams['_metadata']
    _middlewareArgs: TParams['_middlewareArgs']
    _errorShape: TParams['_errorShape']
    _errorFn: TParams['_errorFn']
  }>
  middleware: <TOutput extends Record<string, unknown>>(
    fn: TParams['_metadata'] extends UnsetMarker
      ? MiddlewareFn<TParams['_input'], TOutput, TParams['_middlewareArgs']>
      : ErrorMessage<'middleware is already set'>,
  ) => UploadBuilder<{
    _input: TParams['_input']
    _metadata: TOutput
    _middlewareArgs: TParams['_middlewareArgs']
    _errorShape: TParams['_errorShape']
    _errorFn: TParams['_errorFn']
  }>
}

export type UploadBuilderDef<TParams extends AnyParams> = {
  routerConfig: FileRouterInputConfig
  inputParser: JsonParser
  middleware: MiddlewareFn<TParams['_input'], {}, TParams['_middlewareArgs']>
  errorFormatter: (err: UploadThingError) => TParams['_errorShape']
  onUploadError: UploadErrorFn
}

function internalCreateBuilder<
  TMiddlewareArgs extends MiddlewareFnArgs<any, any, any>,
  TErrorShape extends Json = { message: string },
>(
  initDef: Partial<UploadBuilderDef<any>> = {},
): UploadBuilder<{
  _input: UnsetMarker
  _metadata: UnsetMarker
  _middlewareArgs: TMiddlewareArgs
  _errorShape: TErrorShape
  _errorFn: UnsetMarker
}> {
  const _def: UploadBuilderDef<AnyParams> = {
    // Default router config
    routerConfig: {
      image: {
        maxFileSize: '4MB',
      },
    },

    inputParser: { parse: () => ({}), _input: {}, _output: {} },

    middleware: () => ({}),
    onUploadError: () => ({}),

    errorFormatter: initDef.errorFormatter ?? defaultErrorFormatter,

    // Overload with properties passed in
    ...initDef,
  }

  return {
    input(userParser) {
      return internalCreateBuilder({
        ..._def,
        inputParser: userParser,
      }) as UploadBuilder<any>
    },
    middleware(userMiddleware) {
      return internalCreateBuilder({
        ..._def,
        middleware: userMiddleware,
      }) as UploadBuilder<any>
    },
  }
}

type InOut<TMiddlewareArgs extends MiddlewareFnArgs<any, any, any>, TErrorShape extends Json = { message: string }> = (
  input: FileRouterInputConfig,
) => UploadBuilder<{
  _input: UnsetMarker
  _metadata: UnsetMarker
  _middlewareArgs: TMiddlewareArgs
  _errorShape: TErrorShape
  _errorFn: UnsetMarker
}>

export function createBuilder<
  TMiddlewareArgs extends MiddlewareFnArgs<any, any, any>,
  TErrorShape extends Json = { message: string },
>(opts?: CreateBuilderOptions<TErrorShape>): InOut<TMiddlewareArgs, TErrorShape> {
  return (input: FileRouterInputConfig) => {
    return internalCreateBuilder<TMiddlewareArgs, TErrorShape>({
      routerConfig: input,
      ...opts,
    })
  }
}

export const createUploadthing = <TErrorShape extends Json>(opts?: CreateBuilderOptions<TErrorShape>) =>
  createBuilder<{ req: NextRequest; res: undefined; event: undefined }, TErrorShape>(opts)

export const createNextRouteHandler = <TRouter extends FileRouter>(opts: RouterWithConfig<TRouter>) => {
  return createServerHandler(opts)
}
