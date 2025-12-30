export class GuardrailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuardrailError";
  }
}

export class JailbreakAttemptError extends GuardrailError {
  constructor(
    message: string = "Your request appears to violate our usage policy. Please try again with a different question."
  ) {
    super(message);
    this.name = "JailbreakAttemptError";
  }
}

export class MaliciousContentError extends GuardrailError {
  constructor(
    message: string = "Your request contains potentially harmful content. Please try again."
  ) {
    super(message);
    this.name = "MaliciousContentError";
  }
}
