type ErrorOptions = Error | Record<string, unknown>

type ErrorType =
  | 'AdapterError'
  | 'UnknownAction'
  | 'UnsupportedStrategy'
  | 'MissingAdapter'
  | 'MissingAdapterMethods'

export class CourseBuilderError extends Error {
  /** The error type. Used to identify the error in the logs. */
  type: ErrorType
  /**
   * Determines on which page an error should be handled. Typically `signIn` errors can be handled in-page.
   * Default is `"error"`.
   * @internal
   */
  kind?: 'error'
  cause?: Record<string, unknown> & { err?: Error }
  constructor(
    message?: string | Error | ErrorOptions,
    errorOptions?: ErrorOptions,
  ) {
    if (message instanceof Error) {
      super(undefined, {
        cause: { err: message, ...(message.cause as any), ...errorOptions },
      })
    } else if (typeof message === 'string') {
      if (errorOptions instanceof Error) {
        errorOptions = { err: errorOptions, ...(errorOptions.cause as any) }
      }
      super(message, errorOptions)
    } else {
      super(undefined, message)
    }
    this.name = this.constructor.name
    // @ts-expect-error https://github.com/microsoft/TypeScript/issues/3841
    this.type = this.constructor.type ?? 'CourseBuilderError'
    // @ts-expect-error https://github.com/microsoft/TypeScript/issues/3841
    this.kind = this.constructor.kind ?? 'error'

    Error.captureStackTrace?.(this, this.constructor)
    const url = `https://errors.authjs.dev#${this.type.toLowerCase()}`
    this.message += `${this.message ? '. ' : ''}Read more at ${url}`
  }
}

export class AdapterError extends CourseBuilderError {
  static type = 'AdapterError'
}

export class UnsupportedStrategy extends CourseBuilderError {
  static type = 'UnsupportedStrategy'
}

export class MissingAdapter extends CourseBuilderError {
  static type = 'MissingAdapter'
}

export class MissingAdapterMethods extends CourseBuilderError {
  static type = 'MissingAdapterMethods'
}
