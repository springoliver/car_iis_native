using System.Runtime.InteropServices;
using System.Security;

namespace System.Deployment.Internal.Isolation;

internal struct StoreOperationPinDeployment(IDefinitionAppId AppId, StoreApplicationReference Ref)
{
	[Flags]
	public enum OpFlags
	{
		Nothing = 0,
		NeverExpires = 1
	}

	public enum Disposition
	{
		Failed,
		Pinned
	}

	[MarshalAs(UnmanagedType.U4)]
	public uint Size = (uint)Marshal.SizeOf(typeof(StoreOperationPinDeployment));

	[MarshalAs(UnmanagedType.U4)]
	public OpFlags Flags = OpFlags.NeverExpires;

	[MarshalAs(UnmanagedType.Interface)]
	public IDefinitionAppId Application = AppId;

	[MarshalAs(UnmanagedType.I8)]
	public long ExpirationTime = 0L;

	public IntPtr Reference = Ref.ToIntPtr();

	public StoreOperationPinDeployment(IDefinitionAppId AppId, DateTime Expiry, StoreApplicationReference Ref)
		: this(AppId, Ref)
	{
		Flags |= OpFlags.NeverExpires;
	}

	[SecurityCritical]
	public void Destroy()
	{
		StoreApplicationReference.Destroy(Reference);
	}
}
