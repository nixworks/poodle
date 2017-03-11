/* @flow */

import IconMenu     from 'material-ui/IconMenu'
import IconButton   from 'material-ui/IconButton'
import MenuItem     from 'material-ui/MenuItem'
import * as colors  from 'material-ui/styles/colors'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import * as URI     from 'arfe/lib/models/uri'
import React        from 'react'
import * as helpers from './helpers'

import type { Activity }           from 'poodle-core/lib/queries/localConversation'
import type { ActivityViewProps  } from './types'

export default function ActivityOptsMenu(props: ActivityViewProps) {
  const { activity, dispatch, useremail } = props

  function onMenuAction(event: Event, item: React.Element<any>) {
    const { value } = item.props
    if (value === 'edit') {
      if (helpers.editing(props, activity)) {
        // TODO
        // dispatch(new CE.Reset())
      }
      else {
        // TODO
        // dispatch(new CE.Edit(activity))
      }
    }
    else if (value === 'link') {
      // TODO
      // dispatch(new Ev.ShowLink(activity))
    }
  }

  const edit =
    <MenuItem
      value='edit'
      primaryText='Edit'
      checked={helpers.editing(props, activity)}
      style={{ boxSizing: 'content-box' }}
      disabled={!helpers.myContent(activity, useremail)}
      />

  const link =
    <MenuItem
      value='link'
      primaryText='Permalink'
      style={{ boxSizing: 'content-box' }}
      />

  return <IconMenu
    iconButtonElement={
      <IconButton>
        <MoreVertIcon color={colors.grey400} />
      </IconButton>
    }
    onItemTouchTap={onMenuAction}
    {...props}
    >
    {edit}
    {link}
  </IconMenu>
}
