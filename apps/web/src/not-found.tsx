import Body from '@/components/layout/body'
import {Heading} from '@/components/shared/text'

export default function NotFound() {
    return (
        <Body className="justify-center items-center h-full">
            <div className="flex flex-col max-w-md">
                <img src="/img/cat-chasing-laser-nl.gif"
                     alt="Animated pixel cat chasing a laser, before being beamed up disappearing."
                     className="mx-auto justify-center items-center w-80 h-auto mb-8"
                     style={{
                         imageRendering: 'pixelated'
                     }}
                />
                <Heading className="items-center">
                    Wherever you are, you{'\''}re not supposed to be here.
                </Heading>
                <p className="mt-1 text-sm leading-6 text-muted-foreground unicorn:text-on-surface-variant">
                    This resource doesn{'\''}t exist, or you don{'\''}t have permission to view it.
                </p>
            </div>
        </Body>
    )
}