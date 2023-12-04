import {type SchemaTypeDefinition} from 'sanity'
import workflow from './schemas/documents/workflow'
import delay from './schemas/actions/delay'
import sendEmail from './schemas/actions/send-email'
import slack from './schemas/actions/slack'
import filter from './schemas/actions/filter'
import videoResource from './schemas/documents/videoResource'
import authorType from './schemas/documents/author'
import settingsType from './schemas/settings'
import prompt from './schemas/actions/prompt'
import concept from './schemas/documents/concept'
import exercise from './schemas/documents/exercise'
import explainer from './schemas/documents/explainer'
import module from './schemas/documents/module'
import section from './schemas/documents/section'
import tip from './schemas/documents/tip'
import linkResource from './schemas/documents/linkResource'
import solution from './schemas/objects/solution'
import github from './schemas/objects/github'
import email from './schemas/documents/email'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [
    // documents
    workflow,
    videoResource,
    authorType,
    settingsType,
    concept,
    exercise,
    explainer,
    module,
    section,
    tip,
    linkResource,
    email,
    //objects
    solution,
    github,
    //actions
    delay,
    sendEmail,
    filter,
    slack,
    prompt,
  ],
}
