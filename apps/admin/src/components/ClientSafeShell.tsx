'use client'
import {Notification, Search, Switcher} from '@carbon/icons-react'
import {Button, GlobalTheme, Header, HeaderGlobalAction, HeaderGlobalBar, HeaderName, HeaderPanel} from '@carbon/react'
import {useEffect} from 'react'

export default function ClientSafeShell() {
    const theme = 'g100' // ← your implementation, e.g. fetching user settings

    useEffect(() => {
        document.documentElement.dataset.carbonTheme = theme
    }, [theme])

    return (
        <GlobalTheme theme={theme}>
            <Header aria-label="Rheo">
                <HeaderName
                    href="#"
                    prefix="WB"
                >
                    Rheo
                </HeaderName>
                <HeaderGlobalBar>
                    <HeaderGlobalAction
                        aria-label="Search"
                        onClick={() => {
                        }}
                    >
                        <Search size={20}/>
                    </HeaderGlobalAction>
                    <HeaderGlobalAction
                        aria-label="Notifications"
                        onClick={() => {
                        }}
                        tooltipAlignment="center"
                    >
                        <Notification size={20}/>
                    </HeaderGlobalAction>
                    <HeaderGlobalAction
                        aria-label="App Switcher"
                        onClick={() => {
                        }}
                        tooltipAlignment="end"
                    >
                        <Switcher size={20}/>
                    </HeaderGlobalAction>
                </HeaderGlobalBar>
                <HeaderPanel
                    href="#notification-button"
                />
            </Header>
            <div
                id="main"
                style={{
                    paddingLeft: '5rem',
                    paddingTop: '2rem'
                }}
            >
                <p>
                    Example page content.
                </p>
                <Button
                    disabled={false}
                    href="#"
                    kind="primary"
                    tabIndex={0}
                    type="button"
                >
                    Example button
                </Button>
            </div>
        </GlobalTheme>
    )
}