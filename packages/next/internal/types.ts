export type MiddlewareFnArgs<TRequest, TResponse, TEvent> = {
  req: TRequest
  res: TResponse
  event: TEvent
}

type RouteConfig = {}

export type JsonValue = string | number | boolean | null | undefined
export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue | JsonObject | JsonArray }
export type Json = JsonValue | JsonObject | JsonArray

export const ALLOWED_FILE_TYPES = ['image', 'video', 'audio', 'pdf', 'text', 'blob'] as const

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number]

export type MaybePromise<TType> = TType | Promise<TType>

export type FileRouterInputKey = AllowedFileType

type PartialRouteConfig = Partial<Record<FileRouterInputKey, Partial<RouteConfig>>>

export type FileRouterInputConfig = FileRouterInputKey[] | PartialRouteConfig

export type ParseFn<TType> = (input: unknown) => MaybePromise<TType>
export type ParserZodEsque<TInput, TParsedInput extends Json> = {
  _input: TInput
  _output: TParsedInput // if using .transform etc
  parse: ParseFn<TParsedInput>
}

// In case we add support for more parsers later
export type JsonParser = ParserZodEsque<Json, Json>

export const unsetMarker = 'unsetMarker' as 'unsetMarker' & {
  __brand: 'unsetMarker'
}
export type UnsetMarker = typeof unsetMarker

export type Simplify<TType> = { [TKey in keyof TType]: TType[TKey] } & {}

type MiddlewareFn<
  TInput extends JSON | UnsetMarker,
  TOutput extends Record<string, unknown>,
  TArgs extends MiddlewareFnArgs<any, any, any>,
> = (opts: TArgs & (TInput extends UnsetMarker ? {} : { input: TInput })) => MaybePromise<TOutput>

type ResolverOptions<TParams extends AnyParams> = {
  metadata: Simplify<TParams['_metadata'] extends UnsetMarker ? undefined : TParams['_metadata']>
}

type ResolverFn<TParams extends AnyParams> = (opts: ResolverOptions<TParams>) => MaybePromise<void>

type UploadErrorFn = (input: { error: Error; fileKey: string }) => void

export type UploadBuilderDef<TParams extends AnyParams> = {
  routerConfig: FileRouterInputConfig
  inputParser: JsonParser
  middleware: MiddlewareFn<TParams['_input'], {}, TParams['_middlewareArgs']>
  errorFormatter: (err: Error) => TParams['_errorShape']
  onUploadError: UploadErrorFn
}

export interface Uploader<TParams extends AnyParams> {
  _def: TParams & UploadBuilderDef<TParams>
  resolver: ResolverFn<TParams>
}

export interface AnyParams {
  _input: any
  _metadata: any // imaginary field used to bind metadata return type to an Upload resolver
  _middlewareArgs: MiddlewareFnArgs<any, any, any>
  _errorShape: any
  _errorFn: any // used for onUploadError
}

export type FileRouter<TParams extends AnyParams = AnyParams> = Record<string, Uploader<TParams>>

export type RouterWithConfig<TRouter extends FileRouter> = {
  router: TRouter
  config?: {
    callbackUrl?: string
    uploadthingId?: string
    uploadthingSecret?: string
  }
}
