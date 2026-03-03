using System.Runtime.InteropServices;

namespace System.Deployment.Internal.Isolation;

internal struct StoreOperationSetCanonicalizationContext(string Bases, string Exports)
{
	[Flags]
	public enum OpFlags
	{
		Nothing = 0
	}

	[MarshalAs(UnmanagedType.U4)]
	public uint Size = (uint)Marshal.SizeOf(typeof(StoreOperationSetCanonicalizationContext));

	[MarshalAs(UnmanagedType.U4)]
	public OpFlags Flags = OpFlags.Nothing;

	[MarshalAs(UnmanagedType.LPWStr)]
	public string BaseAddressFilePath = Bases;

	[MarshalAs(UnmanagedType.LPWStr)]
	public string ExportsFilePath = Exports;

	public void Destroy()
	{
	}
}
