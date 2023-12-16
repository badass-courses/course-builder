import type * as Party from 'partykit/server'
import {onConnect} from 'y-partykit'

import {TiptapTransformer} from '@hocuspocus/transformer'

import * as Y from 'yjs'
import {Extension} from '@tiptap/react'
import {StarterKit} from '@tiptap/starter-kit'

export function getBaseExtensions(): Extension[] {
  return [
    StarterKit.configure({
      // The Collaboration extension comes with its own history handling
      history: false,
    }),
  ]
}

const transformer = TiptapTransformer.extensions(getBaseExtensions())
const rootFragmentField = 'default'

export default class Server implements Party.Server {
  constructor(readonly party: Party.Party) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const party = this.party
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.party.id}
  url: ${new URL(ctx.request.url).pathname}`,
    )

    return onConnect(conn, this.party, {})
  }

  messages: string[] = []

  async onStart() {
    this.messages = (await this.party.storage.get<string[]>('messages')) ?? []
  }

  async onRequest(_req: Party.Request) {
    const messageBody: {requestId: string; body: string; name: string} =
      await _req.json()

    this.party.broadcast(JSON.stringify(messageBody))

    return new Response(
      `Party ${this.party.id} has received ${this.messages.length} messages`,
    )
  }

  onMessage(message: string, sender: Party.Connection) {
    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`)
    // as well as broadcast it to all the other connections in the room...
    this.party.broadcast(
      `${sender.id}: ${message}`,
      // ...except for the connection it came from
      [sender.id],
    )
  }
}

Server satisfies Party.Worker
