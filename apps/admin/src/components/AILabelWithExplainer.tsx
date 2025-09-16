import {AILabel, AILabelActions, AILabelContent, Button, IconButton, preview__ShapeIndicator as ShapeIndicator} from '@carbon/react'
import {FolderOpen, Folders, View} from '@carbon/icons-react'

export default function AILabelWithExplainer() {
    return (
        <div className="ai-label-container">
            <AILabel>
                <AILabelContent>
                    {' '}
                    <div>
                        <p className="secondary">
                            AI Explained
                        </p>
                        <h2 className="!mb-3 flex !text-[var(--cds-status-green,#24a148)]">
                            <ShapeIndicator className="[&>svg]:!fill-[var(--cds-status-green,#24a148)]" kind="stable" label=""/>
                            Active
                        </h2>
                        <p className="secondary !font-bold">
                            Rheo is on this page
                        </p>
                        <p className="secondary">
                            Lorem ipsum dolor sit amet, di os consectetur adipiscing elit, sed do eiusmod tempor incididunt ut fsil labore et dolore magna aliqua.
                        </p>
                        <hr/>
                        <p className="secondary">
                            Model type
                        </p>
                        <p className="!font-bold">
                            rheo-1
                        </p>
                    </div>
                    <AILabelActions>
                        <IconButton
                            kind="ghost"
                            label="View"
                        >
                            <View/>
                        </IconButton>
                        <IconButton
                            kind="ghost"
                            label="Open Folder"
                        >
                            <FolderOpen/>
                        </IconButton>
                        <IconButton
                            kind="ghost"
                            label="Folders"
                        >
                            <Folders/>
                        </IconButton>
                        <Button>
                            View details
                        </Button>
                    </AILabelActions>
                </AILabelContent>
            </AILabel>
        </div>
    )
}