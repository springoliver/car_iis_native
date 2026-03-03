using System.Runtime.InteropServices;

namespace System.Reflection.Emit;

[Serializable]
[ComVisible(true)]
public struct EventToken(int str)
{
	public static readonly EventToken Empty;

	internal int m_event = str;

	public int Token => m_event;

	public override int GetHashCode()
	{
		return m_event;
	}

	public override bool Equals(object obj)
	{
		if (obj is EventToken)
		{
			return Equals((EventToken)obj);
		}
		return false;
	}

	public bool Equals(EventToken obj)
	{
		return obj.m_event == m_event;
	}

	public static bool operator ==(EventToken a, EventToken b)
	{
		return a.Equals(b);
	}

	public static bool operator !=(EventToken a, EventToken b)
	{
		return !(a == b);
	}
}
