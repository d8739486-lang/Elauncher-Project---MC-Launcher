param(
    [Parameter(Mandatory=$true)][string]$action,
    [Parameter(Mandatory=$true)][long]$mcHwnd,
    [long]$overlayHwnd = 0,
    [int]$width = 1280,
    [int]$height = 720,
    [int]$topOffset = 44
)

$code = @"
using System;
using System.Runtime.InteropServices;

public class WinEmbedder {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    public static bool Embed(long childHwnd, long parentHwnd, int w, int h, int top) {
        if (childHwnd == 0 || parentHwnd == 0) return false;
        IntPtr child = new IntPtr(childHwnd);
        IntPtr parent = new IntPtr(parentHwnd);

        // GWL_STYLE = -16
        int style = GetWindowLong(child, -16);
        // Strip WS_POPUP, WS_CAPTION, WS_THICKFRAME, WS_MINIMIZEBOX, WS_MAXIMIZEBOX, WS_SYSMENU
        style &= ~unchecked((int)0x80000000); // WS_POPUP
        style &= ~0x00C00000;                 // WS_CAPTION
        style &= ~0x00040000;                 // WS_THICKFRAME
        style &= ~0x00020000;                 // WS_MINIMIZEBOX
        style &= ~0x00010000;                 // WS_MAXIMIZEBOX
        style &= ~0x00080000;                 // WS_SYSMENU

        // Add WS_CHILD, WS_VISIBLE, WS_CLIPCHILDREN, WS_CLIPSIBLINGS
        style |= 0x40000000;                  // WS_CHILD
        style |= 0x10000000;                  // WS_VISIBLE
        style |= 0x04000000;                  // WS_CLIPSIBLINGS
        style |= 0x02000000;                  // WS_CLIPCHILDREN

        SetWindowLong(child, -16, style);
        SetParent(child, parent);

        int targetH = Math.Max(100, h - top);
        int targetW = Math.Max(100, w);

        // SWP_NOZORDER (4) | SWP_FRAMECHANGED (32) | SWP_SHOWWINDOW (64)
        SetWindowPos(child, IntPtr.Zero, 0, top, targetW, targetH, 0x0004 | 0x0020 | 0x0040);
        ShowWindow(child, 1); // SW_SHOWNORMAL
        return true;
    }

    public static bool Resize(long childHwnd, int w, int h, int top) {
        if (childHwnd == 0) return false;
        IntPtr child = new IntPtr(childHwnd);
        int targetH = Math.Max(100, h - top);
        int targetW = Math.Max(100, w);
        return SetWindowPos(child, IntPtr.Zero, 0, top, targetW, targetH, 0x0004 | 0x0020 | 0x0040);
    }
}
"@

if (-not ([System.Management.Automation.PSTypeName]'WinEmbedder').Type) {
    Add-Type -TypeDefinition $code
}

if ($action -eq "embed") {
    $res = [WinEmbedder]::Embed($mcHwnd, $overlayHwnd, $width, $height, $topOffset)
    Write-Output "EMBED_RESULT:$res"
} elseif ($action -eq "resize") {
    $res = [WinEmbedder]::Resize($mcHwnd, $width, $height, $topOffset)
    Write-Output "RESIZE_RESULT:$res"
}
