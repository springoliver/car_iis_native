namespace System.Collections.Concurrent;

internal struct VolatileBool(bool value)
{
	public volatile bool m_value = value;
}
