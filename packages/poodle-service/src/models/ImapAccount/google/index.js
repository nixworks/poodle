/* @flow */

import google from 'googleapis'
import Connection from 'imap'
import { stringify } from 'querystring'
import fetch from 'node-fetch'
import xoauth2 from 'xoauth2'
import { type SmtpConfig } from '../../../smtp'
import { lift1 } from '../../../util/promises'
import {
  type ConnectionFactory,
  type GoogleAccount,
  type OauthCredentials,
} from '../types'

import type { ImapOpts } from 'imap'

export type AccessTokenOpts = {
  scopes: string[],
  client_id: string,
  client_secret: string,
  login_hint?: string,
  include_granted_scopes?: boolean
}

export type TokenGeneratorOpts = {
  email: string,
  client_id: string,
  client_secret: string,
  credentials: OauthCredentials
}

// An object that satisfies this `BrowserWindow` is required to open a window to
// complete the OAuth flow. The object must emit an event called
// `'page-title-updated'` when the window title changes.
//
// An Electron BrowserWindow instance will satisfy this interface.
export interface BrowserWindow extends events$EventEmitter {
  close(): mixed,
  getTitle(): string,
  loadURL(url: string): mixed
}

export type XOAuth2Generator = Generator

declare class Generator extends stream$Readable {
  constructor(options?: Object): void,
  getToken(cb: (err: Error, token: string) => mixed): void,
  updateToken(accessToken: string, timeout: number): void,
  generateToken(cb: (err: Error, token: string) => mixed): void
}

// // Example scopes:
// const scopes = [
//   'email',  // get user's email address
//   'https://mail.google.com/',  // IMAP and SMTP access
//   'https://www.googleapis.com/auth/contacts.readonly',  // contacts, read-only
// ]

export function getAccessToken (
  openWindow: () => BrowserWindow,
  opts: AccessTokenOpts
): Promise<OauthCredentials> {
  const { client_id, client_secret } = opts
  return getAuthorizationCode(openWindow, opts)
    .then(authorizationCode => {
      const body = stringify({
        code: authorizationCode,
        client_id,
        client_secret,
        grant_type: 'authorization_code',
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
      })
      return fetch('https://accounts.google.com/o/oauth2/token', {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      })
    })
    .then(res => res.json())
}

export function getTokenGenerator (
  opts: TokenGeneratorOpts
): Promise<XOAuth2Generator> {
  const { credentials: creds } = opts
  if (creds && creds.refresh_token) {
    return Promise.resolve(tokenGenerator(opts))
  } else {
    return Promise.reject(new Error('OAuth credentials are not available.'))
  }
}

export async function getConnection (
  tokenGen: XOAuth2Generator
): Promise<Connection> {
  const token = await lift1(cb => tokenGen.getToken(cb))
  return initImap(token)
}

export async function getConnectionFactory (
  account: GoogleAccount
): Promise<ConnectionFactory> {
  const tokGen = await getTokenGenerator(account)
  return () => getConnection(tokGen)
}

export async function getSmtpConfig (
  account: GoogleAccount
): Promise<SmtpConfig> {
  const { client_id, client_secret, credentials } = account
  return {
    service: 'Gmail',
    auth: {
      type: 'OAuth2',
      accessToken: credentials.access_token,
      // accessUrl: 'https://accounts.google.com/o/oauth2/token',
      clientId: client_id,
      clientSecret: client_secret,
      expires: credentials.expires_in,
      refreshToken: credentials.refresh_token,
      service: 'Gmail',
      user: account.email
    }
  }
}

export function initImap (
  token: string,
  opts: ImapOpts = {}
): Promise<Connection> {
  const imap = new Connection({
    ...opts,
    xoauth2: token,
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  })
  const p = new Promise((resolve, reject) => {
    imap.once('ready', () => resolve(imap))
    imap.once('error', reject)
  })
  imap.connect()
  return p
}

function tokenGenerator (opts: TokenGeneratorOpts): XOAuth2Generator {
  const { email, client_id, client_secret, credentials } = opts
  return xoauth2.createXOAuth2Generator({
    user: email,
    // accessUrl:    'https://accounts.google.com/oauth2/v3/token',
    clientId: client_id,
    clientSecret: client_secret,
    refreshToken: credentials.refresh_token,
    customParams: {
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
    }
  })
}

function getAuthorizationCode (
  openWindow: () => BrowserWindow,
  {
    scopes,
    client_id,
    client_secret,
    login_hint,
    include_granted_scopes
  }: AccessTokenOpts
): Promise<string> {
  const params: Object = {
    access_type: 'offline',
    scope: scopes
  }
  if (login_hint) {
    params.login_hint = login_hint
  }
  if (typeof include_granted_scopes === 'boolean') {
    params.include_granted_scopes = include_granted_scopes
  }
  const url = oauthClient(client_id, client_secret).generateAuthUrl(params)
  return authorizeApp(openWindow, url)
}

export type OauthClient = Object // TODO

export function oauthClient (
  client_id: string,
  client_secret: string
): OauthClient {
  const OAuth2 = google.auth.OAuth2
  return new OAuth2(client_id, client_secret, 'urn:ietf:wg:oauth:2.0:oob')
}

function authorizeApp (
  openWindow: () => BrowserWindow,
  url: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const win = openWindow()
    setImmediate(() => {
      win.loadURL(url)
    })

    win.on('closed', () => {
      reject(new Error('User closed the window'))
    })

    win.on('page-title-updated', () => {
      setImmediate(() => {
        const title = win.getTitle()
        if (title.startsWith('Denied')) {
          reject(new Error(title.split(/[ =]/)[2]))
          win.removeAllListeners('closed')
          win.close()
        } else if (title.startsWith('Success')) {
          resolve(title.split(/[ =]/)[2])
          win.removeAllListeners('closed')
          win.close()
        }
      })
    })
  })
}
