using System.Runtime.InteropServices;

namespace System.Reflection.Emit;

[Serializable]
[ComVisible(true)]
public struct FieldToken(int field, Type fieldClass)
{
	public static readonly FieldToken Empty;

	internal int m_fieldTok = field;

	internal object m_class = fieldClass;

	public int Token => m_fieldTok;

	public override int GetHashCode()
	{
		return m_fieldTok;
	}

	public override bool Equals(object obj)
	{
		if (obj is FieldToken)
		{
			return Equals((FieldToken)obj);
		}
		return false;
	}

	public bool Equals(FieldToken obj)
	{
		if (obj.m_fieldTok == m_fieldTok)
		{
			return obj.m_class == m_class;
		}
		return false;
	}

	public static bool operator ==(FieldToken a, FieldToken b)
	{
		return a.Equals(b);
	}

	public static bool operator !=(FieldToken a, FieldToken b)
	{
		return !(a == b);
	}
}
