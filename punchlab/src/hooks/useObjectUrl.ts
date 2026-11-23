import { useEffect, useState } from 'react'

interface Entry {
  blob: Blob
  url: string
}

/** Object URL for a stored Blob, revoked when the blob changes or the component unmounts. */
export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [entry, setEntry] = useState<Entry>()
  useEffect(() => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    // Object URLs are an external resource that must be created and revoked in step with the blob.
    // oxlint-disable-next-line react/set-state-in-effect
    setEntry({ blob, url })
    return () => URL.revokeObjectURL(url)
  }, [blob])
  return entry && entry.blob === blob ? entry.url : undefined
}
