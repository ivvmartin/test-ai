export class BillingError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(
    message: string,
    code: string = "BILLING_ERROR",
    statusCode: number = 500
  ) {
    super(message);
    this.name = "BillingError";
    this.code = code;
    this.statusCode = statusCode;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BillingError);
    }
  }
}

export class StripeConfigError extends BillingError {
  constructor(message: string) {
    super(message, "STRIPE_CONFIG_ERROR", 500);
    this.name = "StripeConfigError";
  }
}

export class WebhookVerificationError extends BillingError {
  constructor(message: string) {
    super(message, "WEBHOOK_VERIFICATION_ERROR", 400);
    this.name = "WebhookVerificationError";
  }
}

export class SubscriptionNotFoundError extends BillingError {
  constructor(message: string = "Subscription not found") {
    super(message, "SUBSCRIPTION_NOT_FOUND", 404);
    this.name = "SubscriptionNotFoundError";
  }
}

export class CustomerNotFoundError extends BillingError {
  constructor(message: string = "Customer not found") {
    super(message, "CUSTOMER_NOT_FOUND", 404);
    this.name = "CustomerNotFoundError";
  }
}
