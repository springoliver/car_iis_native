using System.Runtime.InteropServices;
using System.Security;

namespace System.Deployment.Internal.Isolation;

internal struct StoreOperationUnpinDeployment(IDefinitionAppId app, StoreApplicationReference reference)
{
	[Flags]
	public enum OpFlags
	{
		Nothing = 0
	}

	public enum Disposition
	{
		Failed,
		Unpinned
	}

	[MarshalAs(UnmanagedType.U4)]
	public uint Size = (uint)Marshal.SizeOf(typeof(StoreOperationUnpinDeployment));

	[MarshalAs(UnmanagedType.U4)]
	public OpFlags Flags = OpFlags.Nothing;

	[MarshalAs(UnmanagedType.Interface)]
	public IDefinitionAppId Application = app;

	public IntPtr Reference = reference.ToIntPtr();

	[SecurityCritical]
	public void Destroy()
	{
		StoreApplicationReference.Destroy(Reference);
	}
}
