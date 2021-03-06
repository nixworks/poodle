/* @flow */

import chrome, {
  type State as ChromeState
} from 'poodle-core/lib/reducers/chrome'
import { type State as ComposeState, reducer as compose } from 'poodle-core/lib/compose'
import { type State as ImapState, reducer as imap } from 'poodle-core/lib/imap-redux'
import queue, { type State as QueueState } from 'poodle-core/lib/queue/reducer'
import auth, { type State as AuthState } from 'poodle-core/lib/reducers/auth'
import * as slurp from 'poodle-core/lib/slurp'
import { combineReducers } from 'redux'

import type { Reducer } from 'redux'

export type State = {
  auth: AuthState,
  chrome: ChromeState,
  compose: ComposeState,
  imap: ImapState,
  queue: QueueState,
  router: Object,
  slurp: slurp.State
}

export default function buildRootReducer (
  routerReducer: Reducer<Object, any>
): Reducer<State, *> {
  return combineReducers({
    auth,
    chrome,
    compose,
    imap,
    queue,
    router: routerReducer,
    slurp: slurp.reducer
  })
}
