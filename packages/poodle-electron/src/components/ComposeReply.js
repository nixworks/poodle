/* @flow */

import Conversation, { type Participants } from 'arfe/lib/models/Conversation'
import marked from 'marked'
import { FlatButton, IconButton, IconMenu, Paper, TextField } from 'material-ui'
import MenuItem from 'material-ui/MenuItem'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import spacing from 'material-ui/styles/spacing'
import * as m from 'mori'
import PropTypes from 'prop-types'
import * as React from 'react'
import * as auth from 'poodle-core/lib/actions/auth'
import * as compose from 'poodle-core/lib/compose'
import { type State } from '../reducers'

type OwnProps = {
  account: auth.Account,
  conversation: Conversation,
  draftId: compose.ID,
  hintText?: string,
  showAddPeople?: boolean
}

type Props = OwnProps & compose.Props

const styles = {
  activityCard: {
    paddingBottom: `${spacing.desktopGutterLess * 1}px`
  },
  body: {
    padding: `${spacing.desktopKeylineIncrement * 1}px`,
    paddingTop: 0
  },
  menu: {
    float: 'right'
  }
}

export function ComposeReply (props: Props) {
  const recipients = props.conversation.replyRecipients(props.account)
  const contentString = props.content && props.content.string

  function onSend (event) {
    event.preventDefault()
    const content = props.content
    if (content) {
      props.onReply(props.conversation, recipients, {
        mediaType: 'text/html',
        string: marked(content.string)
      })
    }
  }

  return (
    <div style={styles.activityCard}>
      <Paper>
        <ComposeOptsMenu
          style={styles.menu}
          showAddPeople={props.showAddPeople}
        />
        <form style={styles.body} onSubmit={onSend}>
          {props.showAddPeople ? <div>TODO: UI to edit recipients</div> : ''}

          <TextField
            hintText={props.hintText || 'Compose reply'}
            multiLine={true}
            fullWidth={true}
            name='body'
            onChange={event =>
              props.onContentChange({
                mediaType: 'text/markdown',
                string: event.currentTarget.value
              })}
            value={contentString || ''}
          />
          <br />

          <FlatButton
            label='Reply'
            disabled={props.sending}
            onTouchTap={onSend}
          />
        </form>
      </Paper>
    </div>
  )
}

type ComposeOptsMenuProps = {
  showAddPeople?: boolean
}

function ComposeOptsMenu (props: ComposeOptsMenuProps, context) {
  const { palette } = context.muiTheme.baseTheme
  return (
    <IconMenu
      iconButtonElement={
        <IconButton>
          <MoreVertIcon color={palette.secondaryTextColor} />
        </IconButton>
      }
      onItemTouchTap={onMenuAction.bind(null, props)}
      {...props}
    >
      <MenuItem
        value='addPeople'
        primaryText='Add people'
        checked={props.showAddPeople}
        style={{ boxSizing: 'content-box' }}
      />
    </IconMenu>
  )
}

ComposeOptsMenu.contextTypes = {
  muiTheme: PropTypes.object.isRequired
}

function onMenuAction (
  props: ComposeOptsMenuProps,
  event,
  item: React.Element<*>
) {
  if (item.props.value === 'addPeople') {
    alert('TODO: implement recipient list editing')
  }
}

export default (compose.ComposeHOC(ComposeReply): React.ComponentType<OwnProps>)
