import {
  AbilityBuilder,
  type CreateAbility,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability";
import z from "zod";

export const UserSchema = z.object({
  role: z.string().optional(),
  id: z.string().optional(),
  name: z.nullable(z.string().optional()),
  email: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

type Actions = "create" | "read" | "update" | "delete" | "manage";
type Subjects = "Content" | "User" | User | "all";

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

type GetAbilityOptions = { user?: { id: string; role?: string } };

/**
 * serializable CASL rules object
 *
 * @see https://casl.js.org/v6/en/guide/define-rules
 * @param options
 */
export function getAbilityRules(options: GetAbilityOptions = {}) {
  const { can, rules } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (options.user?.role === "admin") {
    can("manage", "all");
  }

  if (options.user) {
    can("read", "User", { id: options.user.id });
  }

  return rules;
}

/**
 * "compiled" ability generated from a bag of options passed in where the options determine what
 * `can` be performed as an ability
 *
 * any asynchronous logic should be handled in the construction of the options
 *
 * @see https://casl.js.org/v6/en/guide/intro
 * @param options
 */
export function getAbility(options: GetAbilityOptions = {}) {
  return createAppAbility(getAbilityRules(options));
}
