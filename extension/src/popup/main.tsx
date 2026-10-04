import React from 'react'
import ReactDOM from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { setApiBaseUrl } from '../../../src/api/client'
import { getServerUrl } from '../settings'
import { Popup } from './Popup'
import '../../../src/index.css'

// The server address has to be known before the first request, so it is read before anything renders.
void getServerUrl().then(serverUrl => {
  setApiBaseUrl(serverUrl)
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      {/* The shared rows link to the web app's pages; YouTubeLinks turns those into YouTube Music tabs. */}
      <MemoryRouter>
        <Popup serverUrl={serverUrl} />
      </MemoryRouter>
    </React.StrictMode>,
  )
})
