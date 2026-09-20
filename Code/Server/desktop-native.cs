using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Collections.Generic;
using System.Windows.Forms;

public static class NexoDesktop {
    [StructLayout(LayoutKind.Sequential)] struct INPUT { public uint type; public UNION data; }
    [StructLayout(LayoutKind.Explicit)] struct UNION {
        [FieldOffset(0)] public MOUSEINPUT mouse;
        [FieldOffset(0)] public KEYBDINPUT key;
    }
    [StructLayout(LayoutKind.Sequential)] struct MOUSEINPUT {
        public int dx, dy; public uint mouseData, flags, time; public UIntPtr extra;
    }
    [StructLayout(LayoutKind.Sequential)] struct KEYBDINPUT {
        public ushort vk, scan; public uint flags, time; public UIntPtr extra;
    }
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] struct POINT { public int X,Y; }
    public delegate bool EnumWindowProc(IntPtr hwnd, IntPtr param);
    [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr value);
    [DllImport("user32.dll", SetLastError=true)] static extern uint SendInput(uint count, INPUT[] input, int size);
    [DllImport("user32.dll")] static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int key);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern IntPtr WindowFromPoint(POINT point);
    [DllImport("user32.dll")] static extern IntPtr GetAncestor(IntPtr hwnd,uint flag);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr hwnd, StringBuilder text, int max);
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hwnd);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumWindowProc proc, IntPtr param);
    [DllImport("user32.dll")] static extern bool PostMessage(IntPtr hwnd, uint msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] static extern bool ScreenToClient(IntPtr hwnd, ref POINT point);
    const uint WM_MOUSEMOVE=0x0200, WM_LBUTTONDOWN=0x0201, WM_LBUTTONUP=0x0202,
        WM_RBUTTONDOWN=0x0204, WM_RBUTTONUP=0x0205, WM_MOUSEWHEEL=0x020A;
    const int MK_LBUTTON=0x0001, MK_RBUTTON=0x0002;
    public class Shot {
        public string image, title; public int width, height, left, top, screenWidth, screenHeight;
        public List<RECT> hud = new List<RECT>();
    }
    public static int InputSize() { return Marshal.SizeOf(typeof(INPUT)); }
    public static void Release() {
        foreach(ushort code in new ushort[]{0x10,0x11,0x12,0x5B}) { try {Key(code,true,0);} catch {} }
        try {Mouse(4,0);Mouse(16,0);} catch {}
    }
    public static bool StopPressed() {
        return GetAsyncKeyState(0x11)<0 && GetAsyncKeyState(0x12)<0 && GetAsyncKeyState(0x7B)<0;
    }
    static void CheckStop() { if(StopPressed()) throw new InvalidOperationException("Gestoppt: Strg+Alt+F12."); }
    static void Dpi() { try { SetProcessDpiAwarenessContext(new IntPtr(-4)); } catch(EntryPointNotFoundException) {} }
    static string Title(IntPtr hwnd) { var text=new StringBuilder(512); GetWindowText(hwnd,text,text.Capacity); return text.ToString(); }
    static bool IsHud(string title) { return title.StartsWith("NEXO",StringComparison.OrdinalIgnoreCase); }
    static void Send(INPUT input) {
        if(SendInput(1,new INPUT[]{input},InputSize())!=1)
            throw new InvalidOperationException("Windows hat die Eingabe blockiert (z.B. Administratorfenster).");
    }
    static void Key(ushort vk, bool up, ushort unicode) {
        var input=new INPUT {type=1};
        bool extended=vk==0x5B||(vk>=0x21&&vk<=0x2E);
        input.data.key=new KEYBDINPUT{vk=vk,scan=unicode,flags=(up?2u:0u)|(unicode!=0?4u:0u)|(extended?1u:0u)};
        Send(input);
    }
    static void Mouse(uint flags, int data) {
        var input=new INPUT {type=0};
        input.data.mouse=new MOUSEINPUT {flags=flags,mouseData=unchecked((uint)data)};
        Send(input);
    }
    public static Shot Capture() {
        Dpi(); CheckStop();
        var area=SystemInformation.VirtualScreen;
        double ratio=Math.Min(1.0,Math.Min(1440.0/area.Width,1000.0/area.Height));
        var shot=new Shot {left=area.Left,top=area.Top,screenWidth=area.Width,screenHeight=area.Height,
            width=Math.Max(1,(int)(area.Width*ratio)),height=Math.Max(1,(int)(area.Height*ratio)),
            title=Title(GetForegroundWindow())};
        EnumWindows(delegate(IntPtr hwnd,IntPtr p) {RECT r;if(IsWindowVisible(hwnd)&&IsHud(Title(hwnd))&&GetWindowRect(hwnd,out r))shot.hud.Add(r);return true;},IntPtr.Zero);
        using(var full=new Bitmap(area.Width,area.Height))
        using(var graphics=Graphics.FromImage(full)) {
            graphics.CopyFromScreen(area.Left,area.Top,0,0,area.Size);
            using(var small=new Bitmap(shot.width,shot.height))
            using(var g=Graphics.FromImage(small))
            using(var stream=new MemoryStream()) {
                g.InterpolationMode=System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                g.DrawImage(full,0,0,shot.width,shot.height);
                small.Save(stream,ImageFormat.Jpeg);
                shot.image=Convert.ToBase64String(stream.ToArray());
            }
        }
        return shot;
    }
    static ushort Code(string value) {
        string k=value.ToUpperInvariant();
        if(k.Length==1 && ((k[0]>='A'&&k[0]<='Z')||(k[0]>='0'&&k[0]<='9')))return (ushort)k[0];
        int fn;if(k.StartsWith("F")&&int.TryParse(k.Substring(1),out fn)&&fn>=1&&fn<=24)return (ushort)(111+fn);
        switch(k) {
            case "CTRL":return 0x11; case "ALT":return 0x12; case "SHIFT":return 0x10; case "WIN":return 0x5B;
            case "ENTER":return 0x0D; case "TAB":return 9; case "ESC":return 0x1B;
            case "BACKSPACE":return 8; case "DELETE":return 0x2E; case "SPACE":return 0x20;
            case "UP":return 0x26; case "DOWN":return 0x28; case "LEFT":return 0x25; case "RIGHT":return 0x27;
            case "HOME":return 0x24; case "END":return 0x23; case "PAGEUP":return 0x21; case "PAGEDOWN":return 0x22;
            default:throw new ArgumentException("Unbekannte Taste.");
        }
    }
    static void CheckTarget(int x,int y) {
        IntPtr target=GetAncestor(WindowFromPoint(new POINT {X=x,Y=y}),2);
        if(IsHud(Title(target)))throw new InvalidOperationException("NEXO darf seine eigenen Freigaben nicht bedienen. Wechsle zuerst das Fenster.");
    }
    static IntPtr MakeLParam(int x,int y) { return (IntPtr)((y<<16)|(x&0xFFFF)); }
    // Posting messages straight to the window under the point lets NEXO click
    // without moving the user's own visible cursor. Not every app honours
    // synthetic messages (games, canvas surfaces); the model can retry with
    // pointer=visible (real SetCursorPos+SendInput below) when that happens.
    static IntPtr TargetWindow(int x,int y,out POINT client) {
        IntPtr hwnd=WindowFromPoint(new POINT {X=x,Y=y});
        if(IsHud(Title(GetAncestor(hwnd,2))))throw new InvalidOperationException("NEXO darf seine eigenen Freigaben nicht bedienen. Wechsle zuerst das Fenster.");
        client=new POINT {X=x,Y=y}; ScreenToClient(hwnd,ref client);
        return hwnd;
    }
    static void PostClick(int x,int y,string button,bool down) {
        POINT client; IntPtr hwnd=TargetWindow(x,y,out client);
        uint msg=button=="right"?(down?WM_RBUTTONDOWN:WM_RBUTTONUP):(down?WM_LBUTTONDOWN:WM_LBUTTONUP);
        IntPtr wp=down?(IntPtr)(button=="right"?MK_RBUTTON:MK_LBUTTON):IntPtr.Zero;
        PostMessage(hwnd,msg,wp,MakeLParam(client.X,client.Y));
    }
    public static void Act(string action,int x,int y,int x2,int y2,string text,string chord,int steps,string button,string pointer,
        int left,int top,int width,int height) {
        Dpi();CheckStop();
        var area=SystemInformation.VirtualScreen;
        if(area.Left!=left||area.Top!=top||area.Width!=width||area.Height!=height)
            throw new InvalidOperationException("Bildschirmaufteilung hat sich geändert. Neu ansehen.");
        if(IsHud(Title(GetForegroundWindow())) && (action=="type"||(action=="key"&&chord!="ALT+TAB"&&chord!="WIN"&&chord!="ESC")))
            throw new InvalidOperationException("NEXO darf keine eigenen Freigaben per Tastatur auslösen.");
        if(action=="key") {
            var held=new List<ushort>();
            try {foreach(string part in chord.Split('+')) {CheckStop();ushort code=Code(part);Key(code,false,0);held.Add(code);}}
            finally {for(int i=held.Count-1;i>=0;i--)Key(held[i],true,0);}
        } else if(action=="type") {
            foreach(char c in text) {
                CheckStop();
                if(c=='\0')continue;
                if(c=='\n'||c=='\r')throw new ArgumentException("Text muss einzeilig sein; Enter ist eine eigene Aktion.");
                Key(0,false,c);Key(0,true,c);
            }
        } else if(action=="click"||action=="double_click"||action=="move"||action=="drag"||action=="scroll") {
            if(!area.Contains(x,y))throw new ArgumentException("Punkt liegt außerhalb des Bildschirms.");
            if(action=="drag"&&!area.Contains(x2,y2))throw new ArgumentException("Ziel liegt außerhalb des Bildschirms.");
            if(pointer=="visible") {
                CheckTarget(x,y);
                if(!SetCursorPos(x,y))throw new InvalidOperationException("Maus konnte nicht bewegt werden.");
                if(action=="scroll")Mouse(0x0800,steps*120);
                else if(action=="click"||action=="double_click") {
                    uint down=button=="right"?8u:2u,up=button=="right"?16u:4u;
                    int count=action=="double_click"?2:1;
                    for(int i=0;i<count;i++){CheckStop();try{Mouse(down,0);}finally{Mouse(up,0);}if(i==0&&count==2)Thread.Sleep(70);}
                } else if(action=="drag") {
                    CheckTarget(x2,y2);
                    try {Mouse(2,0);for(int i=1;i<=16;i++){CheckStop();SetCursorPos(x+(x2-x)*i/16,y+(y2-y)*i/16);Thread.Sleep(15);}}
                    finally{Mouse(4,0);}
                }
            } else if(action=="scroll") {
                POINT dummy; IntPtr hwnd=TargetWindow(x,y,out dummy);
                PostMessage(hwnd,WM_MOUSEWHEEL,(IntPtr)(steps*120<<16),MakeLParam(x,y));
            } else if(action=="move") {
                POINT client; IntPtr hwnd=TargetWindow(x,y,out client);
                PostMessage(hwnd,WM_MOUSEMOVE,IntPtr.Zero,MakeLParam(client.X,client.Y));
            } else if(action=="click"||action=="double_click") {
                int count=action=="double_click"?2:1;
                for(int i=0;i<count;i++){CheckStop();PostClick(x,y,button,true);Thread.Sleep(20);PostClick(x,y,button,false);if(i==0&&count==2)Thread.Sleep(70);}
            } else if(action=="drag") {
                POINT client; IntPtr hwnd=TargetWindow(x,y,out client);
                POINT endDummy; TargetWindow(x2,y2,out endDummy);
                PostMessage(hwnd,WM_LBUTTONDOWN,(IntPtr)MK_LBUTTON,MakeLParam(client.X,client.Y));
                for(int i=1;i<=16;i++){
                    CheckStop();
                    POINT step=new POINT {X=x+(x2-x)*i/16,Y=y+(y2-y)*i/16}; ScreenToClient(hwnd,ref step);
                    PostMessage(hwnd,WM_MOUSEMOVE,(IntPtr)MK_LBUTTON,MakeLParam(step.X,step.Y));
                    Thread.Sleep(15);
                }
                POINT end=new POINT {X=x2,Y=y2}; ScreenToClient(hwnd,ref end);
                PostMessage(hwnd,WM_LBUTTONUP,IntPtr.Zero,MakeLParam(end.X,end.Y));
            }
        } else if(action=="wait")Thread.Sleep(500);
        else throw new ArgumentException("Unbekannte Desktop-Aktion.");
    }
    // Deliberately does not press ENTER: Windows Search can fuzzy-match a query
    // to something unrelated (or, for names like "Apple Music" that have no
    // installed app, to whatever it currently prefers). The caller must look
    // at the returned screenshot and confirm the top result itself.
    public static void LaunchApp(string query) {
        Dpi();CheckStop();
        if(IsHud(Title(GetForegroundWindow())))throw new InvalidOperationException("NEXO darf keine eigenen Freigaben per Tastatur auslösen.");
        Key(0x5B,false,0);Key(0x5B,true,0);
        Thread.Sleep(500);CheckStop();
        foreach(char c in query) {
            CheckStop();
            if(c=='\0'||c=='\n'||c=='\r')continue;
            Key(0,false,c);Key(0,true,c);
        }
        Thread.Sleep(300);
    }
}
