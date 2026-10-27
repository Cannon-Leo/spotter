-- Staff email is a sign in identifier, so it follows the same storage rule as
-- Member.email: lower case only, and never an empty string.
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_email_lowercase_check"
  CHECK ("email" IS NULL OR "email" = lower("email"));

ALTER TABLE "Staff" ADD CONSTRAINT "Staff_email_present_check"
  CHECK ("email" IS NULL OR length(btrim("email")) > 0);
