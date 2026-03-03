using System.Runtime.InteropServices;
using System.Security;

namespace System.Deployment.Internal.Isolation;

internal struct StoreApplicationReference(Guid RefScheme, string Id, string NcData)
{
	[Flags]
	public enum RefFlags
	{
		Nothing = 0
	}

	[MarshalAs(UnmanagedType.U4)]
	public uint Size = (uint)Marshal.SizeOf(typeof(StoreApplicationReference));

	[MarshalAs(UnmanagedType.U4)]
	public RefFlags Flags = RefFlags.Nothing;

	public Guid GuidScheme = RefScheme;

	[MarshalAs(UnmanagedType.LPWStr)]
	public string Identifier = Id;

	[MarshalAs(UnmanagedType.LPWStr)]
	public string NonCanonicalData = NcData;

	[SecurityCritical]
	public IntPtr ToIntPtr()
	{
		IntPtr intPtr = Marshal.AllocCoTaskMem(Marshal.SizeOf(this));
		Marshal.StructureToPtr(this, intPtr, fDeleteOld: false);
		return intPtr;
	}

	[SecurityCritical]
	public static void Destroy(IntPtr ip)
	{
		if (ip != IntPtr.Zero)
		{
			Marshal.DestroyStructure(ip, typeof(StoreApplicationReference));
			Marshal.FreeCoTaskMem(ip);
		}
	}
}
