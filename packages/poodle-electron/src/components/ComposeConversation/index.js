/* @flow */

import * as authActions from 'poodle-core/lib/actions/auth'
import * as compose from 'poodle-core/lib/compose'
import AppBar from 'material-ui/AppBar'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton'
import TextField from 'material-ui/TextField'
import spacing from 'material-ui/styles/spacing'
import * as m from 'mori'
import * as React from 'react'
import * as router from 'react-router-redux'
import EditRecipients from '../EditRecipients'

const styles = {
  body: {
    display: 'flex',
    flex: 1
  },
  content: {
    flex: 1,
    padding: spacing.desktopGutter + 'px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  root: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column'
  }
}

export function ComposeConversation (props: compose.Props) {
  return (
    <div style={styles.root}>
      <header>
        <AppBar
          title='New Discussion'
          iconElementLeft={
            <IconButton iconClassName='material-icons'>arrow_back</IconButton>
          }
          onLeftIconButtonTouchTap={() => props.dispatch(router.goBack())}
        />
      </header>
      <div style={styles.body}>
        <main style={styles.content}>
          <Composer {...props} />
        </main>
      </div>
    </div>
  )
}

function Composer (props: compose.Props) {
  const content = props.content && props.content.string
  const mediaType = props.content && props.content.mediaType
  const subject = props.subject
  const valid = props.content && props.recipients
  const onNewDiscussion = () => {
    const { content, recipients } = props
    if (content && recipients && valid) {
      props.onNewDiscussion(recipients, content, subject)
    }
  }
  return (
    <form style={styles.form} onSubmit={onNewDiscussion}>
      <EditRecipients {...props} />
      <br />
      <TextField
        hintText='Subject'
        multiLine={false}
        fullWidth={true}
        name='subject'
        onChange={event => props.onSubjectChange(event.target.value)}
        value={props.subject || ''}
      />
      <br />
      <TextField
        hintText={'Write your message here'}
        multiLine={true}
        fullWidth={true}
        name='body'
        onChange={event =>
          props.onContentChange({
            mediaType: 'text/html', // TODO
            string: event.currentTarget.value
          })}
        value={content || ''}
      />
      <br />
      <FlatButton
        label='Send'
        disabled={props.sending || !valid}
        onClick={onNewDiscussion}
      />
    </form>
  )
}

const ComposeConversationWithState = compose.ComposeHOC(ComposeConversation)

export default ComposeConversationWithState
