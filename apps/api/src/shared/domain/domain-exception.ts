export class DomainException extends Error {
  public readonly reason: string;

  constructor(
    public readonly code: string,
    reason: string,
  ) {
    super(`${code}: ${reason}`);
    this.reason = reason;
    this.name = 'DomainException';
  }
}
