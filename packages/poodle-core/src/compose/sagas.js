/* @flow */

// TODO: these sagas should probably be moved to `imap-redux`, or to top-level
// sagas

import * as compose from 'arfe/lib/compose'
import * as Addr from 'arfe/lib/models/Address'
import * as C from 'poodle-service/lib/ImapInterface/Client'
import * as tasks from 'poodle-service/lib/tasks'
import {
  type Effect,
  all,
  call,
  fork,
  put,
  takeEvery
} from 'redux-saga/effects'
import stringToStream from 'string-to-stream'
import { type Account } from '../actions/auth'
import * as chrome from '../actions/chrome'
import * as composeActions from './actions'

export interface Dependencies {
  imapClient: C.Client
}

// Generator type parameters are of the form: `Generator<+Yield,+Return,-Next>`

function * sendEdit (
  deps: Dependencies,
  action: composeActions.Action
): Generator<Effect, void, any> {
  if (action.type !== composeActions.EDIT) {
    return
  }
  const { account, activity, conversation, recipients, content } = action
  const message = compose.edit({
    ...recipients,
    content: {
      mediaType: content.mediaType,
      stream: stringToStream(content.string)
    },
    conversation,
    activity
  })
  yield * transmit(deps, account, message)
}

function * sendReply (
  deps: Dependencies,
  action: composeActions.Action
): Generator<Effect, void, any> {
  if (action.type !== composeActions.SEND) {
    return
  }
  const { account, conversation, recipients, content } = action
  const sender = Addr.build(account)
  const messageBuilder = compose.comment({
    ...recipients,
    content: {
      mediaType: content.mediaType,
      stream: stringToStream(content.string)
    },
    conversation
  })
  const { message, contentMap } = yield compose.build(messageBuilder, sender)
  const reply = yield compose.serializeFromContentMap({ message, contentMap })
  yield * transmit(deps, account, reply)
}

function * transmit (
  deps: Dependencies,
  account: Account,
  message: compose.MessageConfiguration
): Generator<Effect, void, any> {
  try {
    yield put(composeActions.sending())
    const result = yield C.perform(deps.imapClient, tasks.sendMail, [
      message
    ], {
      accountName: account.email
    }).toPromise()
    console.log('DeliveryResult') // TODO: debugging output
    console.dir(result)
    yield put(composeActions.sent())
  } catch (err) {
    yield put(chrome.showError(err))
  }
}

export default function * root (
  deps: Dependencies
): Generator<Effect, void, any> {
  yield all([
    fork(takeEvery, composeActions.EDIT, sendEdit, deps),
    fork(takeEvery, composeActions.SEND, sendReply, deps)
  ])
}
