namespace System;

internal struct AppDomainHandle(IntPtr domainHandle)
{
	private IntPtr m_appDomainHandle = domainHandle;
}
