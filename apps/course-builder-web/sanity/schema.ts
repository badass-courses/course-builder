import { type SchemaTypeDefinition } from 'sanity'

import delay from './schemas/actions/delay'
import filter from './schemas/actions/filter'
import prompt from './schemas/actions/prompt'
import sendEmail from './schemas/actions/send-email'
import slack from './schemas/actions/slack'
import article from './schemas/documents/article'
import authorType from './schemas/documents/author'
import concept from './schemas/documents/concept'
import email from './schemas/documents/email'
import exercise from './schemas/documents/exercise'
import explainer from './schemas/documents/explainer'
import imageResource from './schemas/documents/imageResource'
import linkResource from './schemas/documents/linkResource'
import module from './schemas/documents/module'
import section from './schemas/documents/section'
import tip from './schemas/documents/tip'
import videoResource from './schemas/documents/videoResource'
import workflow from './schemas/documents/workflow'
import github from './schemas/objects/github'
import solution from './schemas/objects/solution'
import settingsType from './schemas/settings'

export const schema: { types: SchemaTypeDefinition[] } = {
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
    imageResource,
    article,
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
