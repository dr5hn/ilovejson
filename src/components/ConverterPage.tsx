"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Head from "next/head"
import Layout from "@components/layout"
import AlertError from "@components/error"
import FileHistory from "@components/FileHistory"
import { LargeFileIndicator } from "@components/LoadingState"
import { globals } from "@constants/globals"
import { postFileWithProgress } from "@utils/requests"
import { useKeyboardShortcuts } from "@hooks/useKeyboardShortcuts"
import { useFileHistory } from "@hooks/useFileHistory"
import { Upload, ArrowRight, Download, RefreshCcw, Check, FileText, Sparkles, X, Archive } from "lucide-react"

interface ConverterPageProps {
  slug: string
  title: string
  description: string
  fromFormat: string
  toFormat: string
  fromColor: string
  toColor: string
  mimeType: Record<string, string[]>
  maxFileSize?: number
  maxFileSizeLabel?: string
  sampleInput?: string
  sampleOutput?: string
}

type FileResult = {
  file: File
  status: "pending" | "converting" | "done" | "error"
  downloadLink?: string
  downloadFilename?: string
  error?: string
}

export function ConverterPage({
  slug,
  title,
  description,
  fromFormat,
  toFormat,
  fromColor,
  toColor,
  mimeType,
  maxFileSize: maxFileSizeProp,
  maxFileSizeLabel = "100MB",
}: ConverterPageProps) {
  const api = slug?.replace(/-/g, "")
  const fileType = slug?.split("-")

  // Single-file state (unchanged flow)
  const [downloadLink, setDownloadLink] = useState("")
  const [downloadFilename, setDownloadFilename] = useState("")
  const [errorMessage, setErrorMessage] = useState("Something went wrong, Please try again.")
  const [showError, setShowError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [converted, setConverted] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState("")

  // User plan tier
  const [userTier, setUserTier] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/user/tier')
      .then(r => r.json())
      .then(d => setUserTier(d.toolsTier))
      .catch(() => setUserTier('FREE'))
  }, [])

  // Batch state
  const [fileResults, setFileResults] = useState<FileResult[]>([])
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchDone, setBatchDone] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })

  const { addToHistory } = useFileHistory()
  const maxSize = maxFileSizeProp || globals.maxFileSize.free
  const largeFileThreshold = globals.largeFileWarningThreshold

  const resetAll = useCallback(() => {
    setDownloadLink("")
    setDownloadFilename("")
    setConverted(false)
    setShowError(false)
    setLoading(false)
    setUploadProgress(0)
    setProcessingStage("")
    setFileResults([])
    setBatchRunning(false)
    setBatchDone(false)
    setBatchProgress({ current: 0, total: 0 })
  }, [])

  const handleFileAccepted = useCallback((files: File[]) => {
    resetAll()
    if (files.length > 1) {
      setFileResults(files.map(f => ({ file: f, status: "pending" })))
    }
  }, [resetAll])

  const {
    isDragActive,
    getRootProps,
    getInputProps,
    isDragReject,
    isDragAccept,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    maxFiles: 50,
    accept: mimeType,
    minSize: 1,
    maxSize,
    noKeyboard: true,
    onDropAccepted: handleFileAccepted,
  })

  const isBatch = acceptedFiles.length > 1

  // ── Single-file convert ──────────────────────────────────────────────────
  const handleSingleConvert = useCallback(async () => {
    const file = acceptedFiles[0]
    setLoading(true)
    setShowError(false)
    setConverted(false)
    setDownloadLink("")
    setDownloadFilename("")
    setUploadProgress(0)
    setProcessingStage("Uploading file...")

    const formData = new FormData()
    formData.append("fileInfo", file)
    const isLargeFile = file.size > largeFileThreshold

    try {
      const handleProgress = ({ stage, progress, message }: { stage: string; progress: number; message?: string }) => {
        setUploadProgress(progress)
        if (stage === "upload") setProcessingStage(`Uploading... ${progress}%`)
        else if (stage === "processing") setProcessingStage(message || "Converting your file...")
        else if (stage === "complete") setProcessingStage("Complete!")
      }

      const response = await postFileWithProgress(`api/${api}`, formData, isLargeFile ? handleProgress : undefined)

      if (!response || response.success === false) {
        throw new Error(response?.error || response?.message || "Conversion failed")
      }

      const filePath = response?.data || ""
      if (!filePath || typeof filePath !== "string") throw new Error("No file path returned from server")

      const originalName = file.name.split(".")[0]
      const timestamp = new Date().getTime()
      const ext = fileType[fileType.length - 1]
      const filename = `${originalName}_${timestamp}.${ext}`

      setDownloadLink(filePath)
      setDownloadFilename(filename)
      setConverted(true)
      setLoading(false)
      setShowError(false)
      setProcessingStage("")

      addToHistory({
        fileName: file.name,
        fromFormat: fileType[0].toUpperCase(),
        toFormat: fileType[fileType.length - 1].toUpperCase(),
        downloadLink: filePath,
        fileSize: file.size,
      })
    } catch (err: any) {
      const msg = err.message || "Conversion failed. Please try again."
      setErrorMessage(msg)
      setShowError(true)
      setLoading(false)
      setConverted(false)
      setProcessingStage("")
      setTimeout(() => setShowError(false), 8000)
    }
  }, [acceptedFiles, api, fileType, largeFileThreshold, addToHistory])

  // ── Batch convert ────────────────────────────────────────────────────────
  const handleBatchConvert = useCallback(async () => {
    const files = acceptedFiles
    setBatchRunning(true)
    setBatchDone(false)
    setBatchProgress({ current: 0, total: files.length })
    setFileResults(files.map(f => ({ file: f, status: "pending" })))

    for (let i = 0; i < files.length; i++) {
      setBatchProgress({ current: i + 1, total: files.length })
      setFileResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "converting" } : r))

      const formData = new FormData()
      formData.append("fileInfo", files[i])

      try {
        const response = await postFileWithProgress(`api/${api}`, formData)

        if (!response || response.success === false) {
          throw new Error(response?.error || response?.message || "Conversion failed")
        }

        const filePath = response?.data || ""
        if (!filePath) throw new Error("No file path returned from server")

        const originalName = files[i].name.split(".")[0]
        const timestamp = new Date().getTime()
        const ext = fileType[fileType.length - 1]
        const filename = `${originalName}_${timestamp}.${ext}`

        setFileResults(prev => prev.map((r, idx) =>
          idx === i ? { ...r, status: "done", downloadLink: filePath, downloadFilename: filename } : r
        ))

        addToHistory({
          fileName: files[i].name,
          fromFormat: fileType[0].toUpperCase(),
          toFormat: fileType[fileType.length - 1].toUpperCase(),
          downloadLink: filePath,
          fileSize: files[i].size,
        })
      } catch (err: any) {
        const msg = err.message || "Conversion failed"
        setFileResults(prev => prev.map((r, idx) =>
          idx === i ? { ...r, status: "error", error: msg } : r
        ))
        // Stop processing if it's a tier/plan limit error
        if (msg.toLowerCase().includes("plan allows") || msg.toLowerCase().includes("upgrade")) {
          break
        }
      }
    }

    setBatchRunning(false)
    setBatchDone(true)
  }, [acceptedFiles, api, fileType, addToHistory])

  const handleSubmit = useCallback(() => {
    if (!acceptedFiles.length) return
    if (isBatch) handleBatchConvert()
    else handleSingleConvert()
  }, [acceptedFiles, isBatch, handleBatchConvert, handleSingleConvert])

  const handleDownloadAll = useCallback(async () => {
    const done = fileResults.filter(r => r.status === "done" && r.downloadLink)
    if (!done.length) return

    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    await Promise.all(
      done.map(async (r) => {
        const res = await fetch(r.downloadLink!)
        const blob = await res.blob()
        zip.file(r.downloadFilename || r.file.name, blob)
      })
    )

    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const a = document.createElement("a")
    a.href = url
    a.download = `converted_${new Date().getTime()}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [fileResults])

  useKeyboardShortcuts(
    {
      "mod+enter": () => {
        if (acceptedFiles.length > 0 && !loading && !converted && !batchRunning) handleSubmit()
      },
      escape: resetAll,
    },
    { enabled: true }
  )

  const isFileTooLarge = fileRejections?.length > 0 && fileRejections[0]?.file?.size > maxSize
  const selectedFile = acceptedFiles[0]
  const isLargeFile = selectedFile && selectedFile.size > largeFileThreshold
  const selectedFileSizeMB = selectedFile ? selectedFile.size / 1048576 : 0
  const singleStatus = loading ? "loading" : converted ? "converted" : acceptedFiles.length > 0 ? "ready" : "idle"

  const doneCount = fileResults.filter(r => r.status === "done").length

  const pageTitle = `${fromFormat} to ${toFormat} Converter - Free Online | ILoveJSON`
  const metaDescription = `Convert ${fromFormat} to ${toFormat} online for free. No signup required — fast, secure, and easy to use.`

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": `${fromFormat} to ${toFormat} Converter`,
              "description": metaDescription,
              "url": `https://www.ilovejson.com/${slug}`,
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Any",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            })
          }}
        />
      </Head>
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div className="text-center py-10 border-b border-border bg-muted/20">
          <h1 className="text-2xl md:text-3xl font-bold text-balance mb-3 capitalize">{title}</h1>
          <p className="text-lg text-muted-foreground text-balance">{description}</p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg" style={{ backgroundColor: fromColor }}>
              {fromFormat}
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg" style={{ backgroundColor: toColor }}>
              {toFormat}
            </div>
          </div>

          {/* Plan tier badge */}
          {userTier && (
            <div className="flex items-center justify-center mt-5">
              {userTier === 'FREE' ? (
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-muted border border-border text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
                    Free Plan
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground text-xs">1 conversion / tool / day · 5 MB max</span>
                  <a href="/pricing" className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors whitespace-nowrap">
                    Upgrade →
                  </a>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span className="font-semibold text-emerald-700">
                    Tools Pro Plan
                  </span>
                  <span className="text-emerald-600 text-xs">· Unlimited conversions</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div className="flex-1 flex py-14">
          <div
            {...getRootProps({
              className: `w-full rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer flex items-center justify-center ${
                isDragActive || isDragAccept
                  ? "border-red-400 bg-red-50 scale-[1.01]"
                  : showError || isDragReject
                  ? "border-red-300 bg-red-50/50"
                  : "border-border bg-card hover:border-red-300 hover:bg-red-50/30"
              }`,
            })}
          >
            <input {...getInputProps()} />

            {/* ── BATCH MODE ─────────────────────────────────── */}
            {isBatch && (
              <div className="w-full py-10 px-6 md:px-12" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {batchRunning
                        ? `Converting file ${batchProgress.current} of ${batchProgress.total}…`
                        : batchDone
                        ? `Done — ${doneCount} of ${acceptedFiles.length} converted`
                        : `${acceptedFiles.length} files selected`}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {batchRunning ? "Please wait…" : batchDone ? "" : `Click "Convert All" to start`}
                    </p>
                  </div>
                  {!batchRunning && (
                    <button
                      onClick={resetAll}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* File list */}
                <div className="space-y-2 mb-6 max-h-72 overflow-y-auto pr-1">
                  {fileResults.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 bg-muted/40 rounded-xl">
                      {/* Status icon */}
                      <div className="shrink-0">
                        {r.status === "pending" && (
                          <div className="w-6 h-6 rounded-full border-2 border-border" />
                        )}
                        {r.status === "converting" && (
                          <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-red-500 rounded-full animate-spin" />
                        )}
                        {r.status === "done" && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        {r.status === "error" && (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <X className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* File name */}
                      <span className="flex-1 text-sm text-foreground truncate">{r.file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(r.file.size / 1048576).toFixed(1)} MB
                      </span>

                      {/* Download / error */}
                      {r.status === "done" && r.downloadLink && (
                        <a
                          href={r.downloadLink}
                          download={r.downloadFilename}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          <Download className="w-3 h-3" />
                          {toFormat}
                        </a>
                      )}
                      {r.status === "error" && (
                        r.error?.toLowerCase().includes('upgrade') || r.error?.toLowerCase().includes('free limit') || r.error?.toLowerCase().includes('free plan') ? (
                          <a
                            href="/pricing"
                            className="shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
                            onClick={e => e.stopPropagation()}
                          >
                            Upgrade →
                          </a>
                        ) : (
                          <span className="shrink-0 text-xs text-red-500 max-w-[140px] truncate" title={r.error}>
                            {r.error}
                          </span>
                        )
                      )}
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  {!batchRunning && !batchDone && (
                    <button
                      onClick={handleBatchConvert}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-red-500/25 text-base"
                    >
                      <Sparkles className="w-5 h-5" />
                      Convert All ({acceptedFiles.length} files)
                    </button>
                  )}
                  {batchDone && doneCount >= 2 && (
                    <button
                      onClick={handleDownloadAll}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-emerald-500/25 text-base"
                    >
                      <Archive className="w-5 h-5" />
                      Download All as ZIP
                    </button>
                  )}
                  {batchDone && (
                    <button
                      onClick={resetAll}
                      className="inline-flex items-center gap-2 px-6 py-4 border border-border text-foreground font-semibold rounded-2xl hover:bg-secondary transition-colors text-base"
                    >
                      <RefreshCcw className="w-5 h-5" />
                      Convert more files
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── SINGLE FILE MODE ───────────────────────────── */}
            {!isBatch && (
              <>
                {/* IDLE */}
                {singleStatus === "idle" && !isFileTooLarge && (
                  <div className="text-center py-14 px-4 md:px-16 lg:px-32">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-muted to-muted/50 rounded-3xl flex items-center justify-center">
                      <FileText className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground mb-2">
                      {isDragActive ? "Drop it here!" : `Drop your ${fromFormat} file here`}
                    </h3>
                    <p className="text-muted-foreground mb-10">
                      or click to browse — drop multiple files for batch conversion
                    </p>
                    <div className="inline-flex items-center gap-3 px-8 md:px-16 py-5 md:py-6 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-2xl cursor-pointer transition-all shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5 text-lg md:text-xl">
                      <Upload className="w-6 h-6 md:w-7 md:h-7" />
                      Select {fromFormat} file
                    </div>
                    <p className="text-sm text-muted-foreground mt-6">Maximum file size: {maxFileSizeLabel}</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Uploaded files are automatically deleted after 30 minutes.
                    </p>
                  </div>
                )}

                {/* FILE TOO LARGE */}
                {isFileTooLarge && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-3xl flex items-center justify-center">
                      <span className="text-red-500 text-4xl">!</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-red-500 mb-2">File too large!</h3>
                    <p className="text-muted-foreground">Maximum allowed size is {maxFileSizeLabel}</p>
                  </div>
                )}

                {/* READY */}
                {singleStatus === "ready" && (
                  <div className="text-center py-16">
                    <div
                      className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center text-white font-bold text-lg shadow-xl"
                      style={{ backgroundColor: fromColor }}
                    >
                      {fromFormat}
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground mb-2">{selectedFile?.name}</h3>
                    <p className="flex items-center justify-center gap-2 text-base mb-6">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </span>
                      <span className="text-muted-foreground">Ready to convert</span>
                    </p>
                    {isLargeFile && <LargeFileIndicator sizeMB={selectedFileSizeMB} />}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSubmit() }}
                      className="inline-flex items-center gap-3 px-8 md:px-16 py-5 md:py-6 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5 text-xl mt-4"
                    >
                      Convert to {toFormat}
                      <ArrowRight className="w-7 h-7" />
                    </button>
                  </div>
                )}

                {/* LOADING */}
                {singleStatus === "loading" && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-muted">
                      <div className="w-12 h-12 border-4 border-muted-foreground/30 border-t-red-500 rounded-full animate-spin" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Converting...</h3>
                    <p className="text-muted-foreground">{processingStage || "Processing your file..."}</p>
                    {isLargeFile && uploadProgress > 0 && (
                      <div className="w-64 mx-auto mt-4 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* CONVERTED */}
                {singleStatus === "converted" && (
                  <div className="text-center py-16">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div
                        className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-bold text-lg shadow-xl"
                        style={{ backgroundColor: toColor }}
                      >
                        {toFormat}
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Conversion complete!</h3>
                    <p className="text-base text-muted-foreground flex items-center justify-center gap-2 mb-8">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Your {toFormat} file is ready to download
                    </p>
                    <div className="flex flex-col items-center gap-4">
                      <a
                        href={downloadLink}
                        download={downloadFilename}
                        className="inline-flex items-center gap-3 px-8 md:px-16 py-5 md:py-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 text-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-7 h-7" />
                        Download {toFormat}
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); resetAll() }}
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
                      >
                        <RefreshCcw className="w-5 h-5" />
                        Convert another file
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Error / upgrade prompt */}
        {showError && (errorMessage.toLowerCase().includes('upgrade') || errorMessage.toLowerCase().includes('free limit') || errorMessage.toLowerCase().includes('free plan')) ? (
          <div className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <span className="text-amber-500 text-xl shrink-0">⚡</span>
            <p className="flex-1 text-sm font-medium text-amber-800">{errorMessage}</p>
            <a
              href="/pricing"
              className="shrink-0 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
            >
              Upgrade to Pro →
            </a>
          </div>
        ) : (
          <AlertError message={errorMessage} showError={showError} />
        )}

        {/* File history */}
        <div className="px-4 pb-8">
          <FileHistory />
        </div>

      </div>
    </Layout>
  )
}

export default ConverterPage
