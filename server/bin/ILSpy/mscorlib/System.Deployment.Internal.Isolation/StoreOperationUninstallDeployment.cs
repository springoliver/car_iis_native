using System.Runtime.InteropServices;
using System.Security;

namespace System.Deployment.Internal.Isolation;

internal struct StoreOperationUninstallDeployment(IDefinitionAppId appid, StoreApplicationReference AppRef)
{
	[Flags]
	public enum OpFlags
	{
		Nothing = 0
	}

	public enum Disposition
	{
		Failed,
		DidNotExist,
		Uninstalled
	}

	[MarshalAs(UnmanagedType.U4)]
	public uint Size = (uint)Marshal.SizeOf(typeof(StoreOperationUninstallDeployment));

	[MarshalAs(UnmanagedType.U4)]
	public OpFlags Flags = OpFlags.Nothing;

	[MarshalAs(UnmanagedType.Interface)]
	public IDefinitionAppId Application = appid;

	public IntPtr Reference = AppRef.ToIntPtr();

	[SecurityCritical]
	public void Destroy()
	{
		StoreApplicationReference.Destroy(Reference);
	}
}
