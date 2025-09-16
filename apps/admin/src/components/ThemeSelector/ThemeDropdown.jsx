import React, { useContext } from 'react'
import { Dropdown } from '@carbon/react'
import { ThemeContext, themeData } from './ThemeContext'

import './_theme-dropdown.scss'

export const ThemeDropdown = () => {
    const theme = useContext(ThemeContext)

    const setTheme = selectedItem => {
        const bodyElement = document.body
        bodyElement.className = selectedItem.value
        theme.dispatch({ type: selectedItem })
    }

    return (
        <div className="fixed right-4 bottom-4 w-52 hidden">
            <Dropdown
                direction="top"
                ariaLabel="Theme dropdown"
                id="theme-dropdown"
                items={themeData}
                itemToString={item => (item ? item.text : '')}
                onChange={event => setTheme(event.selectedItem)}
                selectedItem={theme.state.currentTheme}
                label="Change theme"
                titleText="Select a theme"
            />
        </div>
    )
}
