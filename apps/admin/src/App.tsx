import React from 'react'
import { ThemeProvider } from '@/components/ThemeSelector/ThemeContext'
import { ThemeDropdown } from '@/components/ThemeSelector/ThemeDropdown'
import {
    Header,
    HeaderContainer,
    HeaderGlobalAction,
    HeaderGlobalBar,
    HeaderMenu,
    HeaderMenuButton,
    HeaderMenuItem,
    HeaderName,
    HeaderNavigation,
    HeaderSideNavItems,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
} from '@carbon/react'
import { Notification, Search } from '@carbon/icons-react'
import { useNavStore } from './stores/navStore'
import { Route } from 'wouter'
import RouteIndex from '@/routes'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
// @ts-expect-error no types available for this package.
import { NonEntitledSection } from '@carbon/ibm-security'
import ReturnTo from './components/ReturnTo'

function App() {
    const navItems = useNavStore(s => s.items)

    return (
        <div>
            <ThemeProvider>
                <SignedIn>
                    <div className="security--shell--active security--shell--active--return">
                        <HeaderContainer
                            render={({ isSideNavExpanded, onClickSideNavExpand }) => (
                                <>
                                    <Header aria-label="Wildbase Rheo" className="!mt-6">
                                        <ReturnTo href="https://work.wildbase.xyz" application="Wildbase Work" view="Home" />
                                        <SkipToContent />

                                        <HeaderMenuButton
                                            aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
                                            onClick={onClickSideNavExpand}
                                            isActive={isSideNavExpanded}
                                            aria-expanded={isSideNavExpanded}
                                        />
                                        <HeaderName href="#" prefix="✱">
                                            Rheo
                                        </HeaderName>
                                        <HeaderNavigation aria-label="Wildbase Rheo">
                                            <HeaderMenuItem href="/">Home</HeaderMenuItem>
                                        </HeaderNavigation>
                                        <HeaderGlobalBar>
                                            <HeaderGlobalAction aria-label="Auth" tooltipAlignment="end">
                                                <SignedIn>
                                                    <UserButton />
                                                </SignedIn>
                                            </HeaderGlobalAction>
                                            {/* <HeaderGlobalAction aria-label="App Switcher" tooltipAlignment="end">
                                        <Switcher size={20} />
                                    </HeaderGlobalAction> */}
                                        </HeaderGlobalBar>
                                        <SideNav
                                            aria-label="Side navigation"
                                            expanded={isSideNavExpanded}
                                            isRail
                                            onSideNavBlur={onClickSideNavExpand}
                                            href="#main-content"
                                            className="!mt-5"
                                        >
                                            <SideNavItems>
                                                <HeaderSideNavItems hasDivider>
                                                    {navItems.map((item, idx) =>
                                                        'children' in item ? (
                                                            <HeaderMenu key={idx} aria-label={item.label} menuLinkName={item.label}>
                                                                {item.children.map(sub => (
                                                                    <HeaderMenuItem key={sub.label} href={sub.href}>
                                                                        {sub.label}
                                                                    </HeaderMenuItem>
                                                                ))}
                                                            </HeaderMenu>
                                                        ) : (
                                                            <HeaderMenuItem key={idx} href={item.href}>
                                                                {item.label}
                                                            </HeaderMenuItem>
                                                        )
                                                    )}
                                                </HeaderSideNavItems>
                                                {navItems
                                                    .filter(item => 'children' in item && item.icon)
                                                    .map((cat, idx) => (
                                                        <SideNavMenu key={idx} renderIcon={cat.icon} title={cat.label}>
                                                            {('children' in cat ? cat.children : [])!.map((sub, idx) => (
                                                                <SideNavMenuItem key={idx} href={sub.href}>
                                                                    {sub.label}
                                                                </SideNavMenuItem>
                                                            ))}
                                                        </SideNavMenu>
                                                    ))}
                                                {navItems
                                                    .filter(item => !('children' in item) && item.icon)
                                                    .map((link, idx) => (
                                                        <SideNavLink key={idx} renderIcon={link.icon} href={link.href}>
                                                            {link.label}
                                                        </SideNavLink>
                                                    ))}
                                            </SideNavItems>
                                        </SideNav>
                                    </Header>
                                </>
                            )}
                        />
                    </div>

                    <div className="!pl-12 !pt-[calc(1.5rem+46px)]">
                        <Route path="/">
                            <RouteIndex />
                        </Route>
                    </div>
                </SignedIn>

                <SignedOut>
                    <NonEntitledSection
                        backgroundImage="/images/entitlement@2x.png"
                        className=""
                        // description="Rheo Core, Monitor."
                        links={[
                            {
                                href: 'https://wildbase.xyz',
                                id: 'lm',
                                text: "You: Oh, oops... I'm sorry for snooping around.",
                            },
                        ]}
                        style={{
                            backgroundPosition: '701px 233px',
                            backgroundSize: '574px 300px',
                            minHeight: '701px',
                        }}
                        subTitle="Other places:"
                        title="You aren't the intended audience for this content. Please contact your administrator for support."
                    />
                </SignedOut>

                <ThemeDropdown />
            </ThemeProvider>
        </div>
    )
}

export default App
