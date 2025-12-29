import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

type HoverCardContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openWithDelay: () => void
  closeWithDelay: () => void
  cancelTimers: () => void
}

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null)

function useHoverCardContext() {
  const ctx = React.useContext(HoverCardContext)
  if (!ctx) throw new Error("HoverCard components must be used within <HoverCard />")
  return ctx
}

type HoverCardProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> & {
  openDelay?: number
  closeDelay?: number
}

const HoverCard = ({
  open: openProp,
  defaultOpen,
  onOpenChange,
  openDelay = 150,
  closeDelay = 100,
  children,
  ...props
}: HoverCardProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState<boolean>(defaultOpen ?? false)
  const isControlled = openProp !== undefined
  const open = isControlled ? Boolean(openProp) : uncontrolledOpen

  const openTimerRef = React.useRef<number | null>(null)
  const closeTimerRef = React.useRef<number | null>(null)

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  const cancelTimers = React.useCallback(() => {
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current)
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    openTimerRef.current = null
    closeTimerRef.current = null
  }, [])

  const openWithDelayFn = React.useCallback(() => {
    cancelTimers()
    openTimerRef.current = window.setTimeout(() => setOpen(true), openDelay)
  }, [cancelTimers, openDelay, setOpen])

  const closeWithDelayFn = React.useCallback(() => {
    cancelTimers()
    closeTimerRef.current = window.setTimeout(() => setOpen(false), closeDelay)
  }, [cancelTimers, closeDelay, setOpen])

  React.useEffect(() => cancelTimers, [cancelTimers])

  const ctx: HoverCardContextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      openWithDelay: openWithDelayFn,
      closeWithDelay: closeWithDelayFn,
      cancelTimers,
    }),
    [open, setOpen, openWithDelayFn, closeWithDelayFn, cancelTimers]
  )

  return (
    <HoverCardContext.Provider value={ctx}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} {...props}>
        {children}
      </PopoverPrimitive.Root>
    </HoverCardContext.Provider>
  )
}

const HoverCardTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
  const { openWithDelay, closeWithDelay, cancelTimers, setOpen } = useHoverCardContext()

  return (
    <PopoverPrimitive.Trigger
      ref={ref}
      onMouseEnter={(e) => {
        onMouseEnter?.(e)
        openWithDelay()
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e)
        closeWithDelay()
      }}
      onFocus={(e) => {
        onFocus?.(e)
        cancelTimers()
        setOpen(true)
      }}
      onBlur={(e) => {
        onBlur?.(e)
        closeWithDelay()
      }}
      {...props}
    />
  )
})
HoverCardTrigger.displayName = "HoverCardTrigger"

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 8, onMouseEnter, onMouseLeave, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => {
  const { cancelTimers, setOpen, closeWithDelay } = useHoverCardContext()

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        onOpenAutoFocus={(e) => {
          onOpenAutoFocus?.(e)
          // Hover behavior: don't steal focus
          if (!e.defaultPrevented) e.preventDefault()
        }}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e)
          // Prevent focus restore to trigger (can cause hover/focus reopen loops)
          if (!e.defaultPrevented) e.preventDefault()
        }}
        onMouseEnter={(e) => {
          onMouseEnter?.(e)
          cancelTimers()
          setOpen(true)
        }}
        onMouseLeave={(e) => {
          onMouseLeave?.(e)
          closeWithDelay()
        }}
        className={cn(
          "z-50 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
HoverCardContent.displayName = "HoverCardContent"

export { HoverCard, HoverCardTrigger, HoverCardContent }


