import {LoadingSpinner} from 'components/icons'

export default function Loading() {
    return (
        <div className="flex items-center justify-center" style={{height: 'calc(100vh - 4rem)'}}>
            <LoadingSpinner />
        </div>
    );
}