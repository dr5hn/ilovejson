"use client"

import { useState, useCallback } from "react"
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
import { Upload, ArrowRight, Download, RefreshCcw, Check, FileText, Sparkles, Zap, Lock, BadgeCheck } from "lucide-react"

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
  sampleInput = `{\n  "name": "John Doe",\n  "email": "john@example.com",\n  "age": 30\n}`,
  sampleOutput = `name,email,age\nJohn Doe,john@example.com,30`,
}: ConverterPageProps) {
  const api = slug?.replace(/-/g, "")
  const fileType = slug?.split("-")

  const [downloadLink, setDownloadLink] = useState("")
  const [downloadFilename, setDownloadFilename] = useState("")
  const [errorMessage, setErrorMessage] = useState("Something went wrong, Please try again.")
  const [showError, setShowError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [converted, setConverted] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState("")

  const { addToHistory } = useFileHistory()
  const maxSize = maxFileSizeProp || globals.maxFileSize.free
  const largeFileThreshold = globals.largeFileWarningThreshold

  const handleFileAccepted = () => {
    if (converted) {
      setDownloadLink("")
      setDownloadFilename("")
      setConverted(false)
      setShowError(false)
      setUploadProgress(0)
      setProcessingStage("")
    }
  }

  const {
    isDragActive,
    getRootProps,
    getInputProps,
    isDragReject,
    isDragAccept,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    maxFiles: 1,
    accept: mimeType,
    minSize: 1,
    maxSize,
    noKeyboard: true,
    onDropAccepted: handleFileAccepted,
  })

  const handleSubmit = useCallback(async () => {
    if (acceptedFiles.length) {
      setLoading(true)
      setShowError(false)
      setConverted(false)
      setDownloadLink("")
      setDownloadFilename("")
      setUploadProgress(0)
      setProcessingStage("Uploading file...")

      const file = acceptedFiles[0]
      const formData = new FormData()
      formData.append("fileInfo", file)

      const isLargeFile = file.size > largeFileThreshold

      try {
        const handleProgress = ({ stage, progress, message }: { stage: string; progress: number; message?: string }) => {
          setUploadProgress(progress)
          if (stage === "upload") {
            setProcessingStage(`Uploading... ${progress}%`)
          } else if (stage === "processing") {
            setProcessingStage(message || "Converting your file...")
          } else if (stage === "complete") {
            setProcessingStage("Complete!")
          }
        }

        const response = await postFileWithProgress(`api/${api}`, formData, isLargeFile ? handleProgress : undefined)

        if (!response || response.success === false) {
          const errorMessage = response?.error || response?.message || "Conversion failed"
          throw new Error(errorMessage)
        }

        const filePath = response?.data || ""

        if (!filePath || typeof filePath !== "string") {
          throw new Error("No file path returned from server")
        }

        setDownloadLink(filePath)

        const originalName = file.name.split(".")[0]
        const timestamp = new Date().getTime()
        const fileExtension = fileType && fileType.length > 0 ? fileType[fileType.length - 1] : "json"
        const filename = `${originalName}_${timestamp}.${fileExtension}`

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
        console.error("Conversion Error:", err)
        let errorMsg = err.message || "Conversion failed. Please try again."
        setErrorMessage(errorMsg)
        setShowError(true)
        setLoading(false)
        setConverted(false)
        setProcessingStage("")
        setTimeout(() => {
          setShowError(false)
        }, 8000)
      }
    }
  }, [acceptedFiles, api, fileType, largeFileThreshold, addToHistory])

  const handleReset = useCallback(() => {
    setDownloadLink("")
    setDownloadFilename("")
    setConverted(false)
    setShowError(false)
    setLoading(false)
    setUploadProgress(0)
    setProcessingStage("")
  }, [])

  useKeyboardShortcuts(
    {
      "mod+enter": () => {
        if (acceptedFiles.length > 0 && !loading && !converted) {
          handleSubmit()
        }
      },
      escape: handleReset,
    },
    { enabled: true }
  )

  const isFileTooLarge = fileRejections?.length > 0 && fileRejections[0]?.file?.size > maxSize
  const selectedFile = acceptedFiles[0]
  const isLargeFile = selectedFile && selectedFile.size > largeFileThreshold
  const selectedFileSizeMB = selectedFile ? selectedFile.size / 1048576 : 0

  const status = loading ? "loading" : converted ? "converted" : acceptedFiles.length > 0 ? "ready" : "idle"

  const pageTitle = `${fromFormat} to ${toFormat} Converter - Free Online | ILoveJSON`
  const metaDescription = `${description} Convert ${fromFormat} to ${toFormat} online for free. No signup required — fast, secure, and easy to use.`

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

        {/* ── HEADER (from ConverterSection) ── */}
        <div className="text-center py-10 border-b border-border bg-muted/20">
          <h1 className="text-2xl md:text-3xl font-bold text-balance mb-3 capitalize">
  {title}
</h1>
          <p className="text-lg text-muted-foreground text-balance">{description}</p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div
              className="px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg"
              style={{ backgroundColor: fromColor }}
            >
              {fromFormat}
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div
              className="px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg"
              style={{ backgroundColor: toColor }}
            >
              {toFormat}
            </div>
          </div>
        </div>

        {/* ── DROP ZONE (full width, from ConverterPage) ── */}
        <div className="flex-1 flex py-14">
          <div
            {...getRootProps({
              className: `w-full rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer flex items-center justify-center ${
                isDragActive || isDragAccept
                  ? "border-red-400 bg-red-50 dark:bg-red-950/30 scale-[1.01]"
                  : showError || isDragReject
                    ? "border-red-300 bg-red-50/50 dark:bg-red-950/20"
                    : "border-border bg-card hover:border-red-300 hover:bg-red-50/30 dark:hover:bg-red-950/10"
              }`,
            })}
          >
            <input {...getInputProps()} />

            {/* IDLE */}
            {status === "idle" && !isFileTooLarge && (
              <div className="text-center py-14 px-4 md:px-16 lg:px-32">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-muted to-muted/50 rounded-3xl flex items-center justify-center">
                  <FileText className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {isDragActive ? "Drop it here!" : `Drop your ${fromFormat} file here`}
                </h3>
                <p className="text-muted-foreground mb-10">or click to browse from your computer</p>
                <div className="inline-flex items-center gap-3 px-8 md:px-16 py-5 md:py-6 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-2xl cursor-pointer transition-all shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5 text-lg md:text-xl">
                  <Upload className="w-6 h-6 md:w-7 md:h-7" />
                  Select {fromFormat} file
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  Maximum file size: {maxFileSizeLabel}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Uploaded files are automatically deleted after 30 minutes.
                </p>
              </div>
            )}

            {/* FILE TOO LARGE */}
            {isFileTooLarge && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-950 rounded-3xl flex items-center justify-center">
                  <span className="text-red-500 text-4xl">!</span>
                </div>
                <h3 className="text-2xl font-semibold text-red-500 mb-2">File too large!</h3>
                <p className="text-muted-foreground">Maximum allowed size is {maxFileSizeLabel}</p>
              </div>
            )}

            {/* READY */}
            {status === "ready" && (
              <div className="text-center py-16">
                <div
                  className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center text-white font-bold text-lg shadow-xl"
                  style={{ backgroundColor: fromColor }}
                >
                  {fromFormat}
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">{selectedFile?.name}</h3>
                <p className="flex items-center justify-center gap-2 text-base mb-6">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
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
            {status === "loading" && (
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
            {status === "converted" && (
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
                    onClick={(e) => { e.stopPropagation(); handleReset() }}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    Convert another file
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── ERROR ── */}
        <AlertError message={errorMessage} showError={showError} />

        {/* ── FILE HISTORY ── */}
        <div className="px-4 pb-8">
          <FileHistory />
        </div>

      </div>
    </Layout>
  )
}

export default ConverterPage
