/* @flow */

import ApolloClient       from 'apollo-client'
import { reduxStore }     from 'poodle-core'
import App                from 'poodle-core/lib/components/App'
import * as React         from 'react'
import { ApolloProvider } from 'react-apollo'
import * as ReactDOM      from 'react-dom'

const client = new ApolloClient()
const store  = reduxStore(client)

export function main(root: Element) {
  ReactDOM.render(
    <ApolloProvider store={store} client={client}>
      <App />
    </ApolloProvider>,
    root
  )
}
