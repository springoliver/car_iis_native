using System.Runtime.InteropServices;

namespace System.Reflection.Emit;

[Serializable]
[ComVisible(true)]
public struct MethodToken(int str)
{
	public static readonly MethodToken Empty;

	internal int m_method = str;

	public int Token => m_method;

	public override int GetHashCode()
	{
		return m_method;
	}

	public override bool Equals(object obj)
	{
		if (obj is MethodToken)
		{
			return Equals((MethodToken)obj);
		}
		return false;
	}

	public bool Equals(MethodToken obj)
	{
		return obj.m_method == m_method;
	}

	public static bool operator ==(MethodToken a, MethodToken b)
	{
		return a.Equals(b);
	}

	public static bool operator !=(MethodToken a, MethodToken b)
	{
		return !(a == b);
	}
}
