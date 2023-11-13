import {AbilityBuilder, CreateAbility, createMongoAbility, MongoAbility} from "@casl/ability";

type Abilities =
  | ['view', 'Anything']
  | ['upload', 'Media']

type AppAbility = MongoAbility<Abilities>

const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

type GetAbilityOptions = {user?:{id:string, role?: string}}

/**
 * serializable CASL rules object
 *
 * @see https://casl.js.org/v6/en/guide/define-rules
 * @param options
 */
export function getAbilityRules(options: GetAbilityOptions = {}) {
  const {can, rules} = new AbilityBuilder<AppAbility>(createMongoAbility)

  if (options.user?.role === 'admin') {
    can('view', 'Anything')
    can('upload', 'Media')
  }

  return rules
}

/**
 * "compiled" ability generated from a bag of options passed in
 * where the options determine what `can` be performed as an ability
 *
 * any asynchronous logic should be handled in the construction of the options
 *
 * @see https://casl.js.org/v6/en/guide/intro
 * @param options
 */
export function getAbility(options: GetAbilityOptions = {}) {
  return createAppAbility(getAbilityRules(options))
}