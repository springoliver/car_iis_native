using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;

namespace ADVMobileApi.Areas.HelpPage;

public class ObjectGenerator
{
	private class SimpleTypeObjectGenerator
	{
		private long _index;

		private static readonly Dictionary<Type, Func<long, object>> DefaultGenerators = InitializeGenerators();

		private static Dictionary<Type, Func<long, object>> InitializeGenerators()
		{
			Dictionary<Type, Func<long, object>> dictionary = new Dictionary<Type, Func<long, object>>();
			dictionary.Add(typeof(bool), (long index) => true);
			dictionary.Add(typeof(byte), (long index) => (byte)64);
			dictionary.Add(typeof(char), (long index) => 'A');
			dictionary.Add(typeof(DateTime), (long index) => DateTime.Now);
			dictionary.Add(typeof(DateTimeOffset), (long index) => new DateTimeOffset(DateTime.Now));
			dictionary.Add(typeof(DBNull), (long index) => DBNull.Value);
			dictionary.Add(typeof(decimal), (long index) => (decimal)index);
			dictionary.Add(typeof(double), (long index) => (double)index + 0.1);
			dictionary.Add(typeof(Guid), (long index) => Guid.NewGuid());
			dictionary.Add(typeof(short), (long index) => (short)(index % 32767));
			dictionary.Add(typeof(int), (long index) => (int)(index % int.MaxValue));
			dictionary.Add(typeof(long), (long index) => index);
			dictionary.Add(typeof(object), (long index) => new object());
			dictionary.Add(typeof(sbyte), (long index) => (sbyte)64);
			dictionary.Add(typeof(float), (long index) => (float)((double)index + 0.1));
			dictionary.Add(typeof(string), (long index) => string.Format(CultureInfo.CurrentCulture, "sample string {0}", index));
			dictionary.Add(typeof(TimeSpan), (long index) => TimeSpan.FromTicks(1234567L));
			dictionary.Add(typeof(ushort), (long index) => (ushort)(index % 65535));
			dictionary.Add(typeof(uint), (long index) => (uint)(index % uint.MaxValue));
			dictionary.Add(typeof(ulong), (long index) => (ulong)index);
			dictionary.Add(typeof(Uri), (long index) => new Uri(string.Format(CultureInfo.CurrentCulture, "http://webapihelppage{0}.com", index)));
			return dictionary;
		}

		public static bool CanGenerateObject(Type type)
		{
			return DefaultGenerators.ContainsKey(type);
		}

		public object GenerateObject(Type type)
		{
			return DefaultGenerators[type](++_index);
		}
	}

	internal const int DefaultCollectionSize = 2;

	private readonly SimpleTypeObjectGenerator SimpleObjectGenerator = new SimpleTypeObjectGenerator();

	public object GenerateObject(Type type)
	{
		return GenerateObject(type, new Dictionary<Type, object>());
	}

	private object GenerateObject(Type type, Dictionary<Type, object> createdObjectReferences)
	{
		try
		{
			if (SimpleTypeObjectGenerator.CanGenerateObject(type))
			{
				return SimpleObjectGenerator.GenerateObject(type);
			}
			if (type.IsArray)
			{
				return GenerateArray(type, 2, createdObjectReferences);
			}
			if (type.IsGenericType)
			{
				return GenerateGenericType(type, 2, createdObjectReferences);
			}
			if (type == typeof(IDictionary))
			{
				return GenerateDictionary(typeof(Hashtable), 2, createdObjectReferences);
			}
			if (typeof(IDictionary).IsAssignableFrom(type))
			{
				return GenerateDictionary(type, 2, createdObjectReferences);
			}
			if (type == typeof(IList) || type == typeof(IEnumerable) || type == typeof(ICollection))
			{
				return GenerateCollection(typeof(ArrayList), 2, createdObjectReferences);
			}
			if (typeof(IList).IsAssignableFrom(type))
			{
				return GenerateCollection(type, 2, createdObjectReferences);
			}
			if (type == typeof(IQueryable))
			{
				return GenerateQueryable(type, 2, createdObjectReferences);
			}
			if (type.IsEnum)
			{
				return GenerateEnum(type);
			}
			if (type.IsPublic || type.IsNestedPublic)
			{
				return GenerateComplexObject(type, createdObjectReferences);
			}
		}
		catch
		{
			return null;
		}
		return null;
	}

	private static object GenerateGenericType(Type type, int collectionSize, Dictionary<Type, object> createdObjectReferences)
	{
		Type genericTypeDefinition = type.GetGenericTypeDefinition();
		if (genericTypeDefinition == typeof(Nullable<>))
		{
			return GenerateNullable(type, createdObjectReferences);
		}
		if (genericTypeDefinition == typeof(KeyValuePair<, >))
		{
			return GenerateKeyValuePair(type, createdObjectReferences);
		}
		if (IsTuple(genericTypeDefinition))
		{
			return GenerateTuple(type, createdObjectReferences);
		}
		Type[] genericArguments = type.GetGenericArguments();
		if (genericArguments.Length == 1)
		{
			if (genericTypeDefinition == typeof(IList<>) || genericTypeDefinition == typeof(IEnumerable<>) || genericTypeDefinition == typeof(ICollection<>))
			{
				Type collectionType = typeof(List<>).MakeGenericType(genericArguments);
				return GenerateCollection(collectionType, collectionSize, createdObjectReferences);
			}
			if (genericTypeDefinition == typeof(IQueryable<>))
			{
				return GenerateQueryable(type, collectionSize, createdObjectReferences);
			}
			Type closedCollectionType = typeof(ICollection<>).MakeGenericType(genericArguments[0]);
			if (closedCollectionType.IsAssignableFrom(type))
			{
				return GenerateCollection(type, collectionSize, createdObjectReferences);
			}
		}
		if (genericArguments.Length == 2)
		{
			if (genericTypeDefinition == typeof(IDictionary<, >))
			{
				Type dictionaryType = typeof(Dictionary<, >).MakeGenericType(genericArguments);
				return GenerateDictionary(dictionaryType, collectionSize, createdObjectReferences);
			}
			Type closedDictionaryType = typeof(IDictionary<, >).MakeGenericType(genericArguments[0], genericArguments[1]);
			if (closedDictionaryType.IsAssignableFrom(type))
			{
				return GenerateDictionary(type, collectionSize, createdObjectReferences);
			}
		}
		if (type.IsPublic || type.IsNestedPublic)
		{
			return GenerateComplexObject(type, createdObjectReferences);
		}
		return null;
	}

	private static object GenerateTuple(Type type, Dictionary<Type, object> createdObjectReferences)
	{
		Type[] genericArgs = type.GetGenericArguments();
		object[] parameterValues = new object[genericArgs.Length];
		bool failedToCreateTuple = true;
		ObjectGenerator objectGenerator = new ObjectGenerator();
		for (int i = 0; i < genericArgs.Length; i++)
		{
			parameterValues[i] = objectGenerator.GenerateObject(genericArgs[i], createdObjectReferences);
			failedToCreateTuple &= parameterValues[i] == null;
		}
		if (failedToCreateTuple)
		{
			return null;
		}
		return Activator.CreateInstance(type, parameterValues);
	}

	private static bool IsTuple(Type genericTypeDefinition)
	{
		if (!(genericTypeDefinition == typeof(Tuple<>)) && !(genericTypeDefinition == typeof(Tuple<, >)) && !(genericTypeDefinition == typeof(Tuple<, , >)) && !(genericTypeDefinition == typeof(Tuple<, , , >)) && !(genericTypeDefinition == typeof(Tuple<, , , , >)) && !(genericTypeDefinition == typeof(Tuple<, , , , , >)) && !(genericTypeDefinition == typeof(Tuple<, , , , , , >)))
		{
			return genericTypeDefinition == typeof(Tuple<, , , , , , , >);
		}
		return true;
	}

	private static object GenerateKeyValuePair(Type keyValuePairType, Dictionary<Type, object> createdObjectReferences)
	{
		Type[] genericArgs = keyValuePairType.GetGenericArguments();
		Type typeK = genericArgs[0];
		Type typeV = genericArgs[1];
		ObjectGenerator objectGenerator = new ObjectGenerator();
		object keyObject = objectGenerator.GenerateObject(typeK, createdObjectReferences);
		object valueObject = objectGenerator.GenerateObject(typeV, createdObjectReferences);
		if (keyObject == null && valueObject == null)
		{
			return null;
		}
		return Activator.CreateInstance(keyValuePairType, keyObject, valueObject);
	}

	private static object GenerateArray(Type arrayType, int size, Dictionary<Type, object> createdObjectReferences)
	{
		Type type = arrayType.GetElementType();
		Array result = Array.CreateInstance(type, size);
		bool areAllElementsNull = true;
		ObjectGenerator objectGenerator = new ObjectGenerator();
		for (int i = 0; i < size; i++)
		{
			object element = objectGenerator.GenerateObject(type, createdObjectReferences);
			result.SetValue(element, i);
			areAllElementsNull = areAllElementsNull && element == null;
		}
		if (areAllElementsNull)
		{
			return null;
		}
		return result;
	}

	private static object GenerateDictionary(Type dictionaryType, int size, Dictionary<Type, object> createdObjectReferences)
	{
		Type typeK = typeof(object);
		Type typeV = typeof(object);
		if (dictionaryType.IsGenericType)
		{
			Type[] genericArgs = dictionaryType.GetGenericArguments();
			typeK = genericArgs[0];
			typeV = genericArgs[1];
		}
		object result = Activator.CreateInstance(dictionaryType);
		MethodInfo addMethod = dictionaryType.GetMethod("Add") ?? dictionaryType.GetMethod("TryAdd");
		MethodInfo containsMethod = dictionaryType.GetMethod("Contains") ?? dictionaryType.GetMethod("ContainsKey");
		ObjectGenerator objectGenerator = new ObjectGenerator();
		for (int i = 0; i < size; i++)
		{
			object newKey = objectGenerator.GenerateObject(typeK, createdObjectReferences);
			if (newKey == null)
			{
				return null;
			}
			if (!(bool)containsMethod.Invoke(result, new object[1] { newKey }))
			{
				object newValue = objectGenerator.GenerateObject(typeV, createdObjectReferences);
				addMethod.Invoke(result, new object[2] { newKey, newValue });
			}
		}
		return result;
	}

	private static object GenerateEnum(Type enumType)
	{
		Array possibleValues = Enum.GetValues(enumType);
		if (possibleValues.Length > 0)
		{
			return possibleValues.GetValue(0);
		}
		return null;
	}

	private static object GenerateQueryable(Type queryableType, int size, Dictionary<Type, object> createdObjectReferences)
	{
		bool isGeneric = queryableType.IsGenericType;
		object list;
		if (isGeneric)
		{
			Type listType = typeof(List<>).MakeGenericType(queryableType.GetGenericArguments());
			list = GenerateCollection(listType, size, createdObjectReferences);
		}
		else
		{
			list = GenerateArray(typeof(object[]), size, createdObjectReferences);
		}
		if (list == null)
		{
			return null;
		}
		if (isGeneric)
		{
			Type argumentType = typeof(IEnumerable<>).MakeGenericType(queryableType.GetGenericArguments());
			MethodInfo asQueryableMethod = typeof(Queryable).GetMethod("AsQueryable", new Type[1] { argumentType });
			return asQueryableMethod.Invoke(null, new object[1] { list });
		}
		return ((IEnumerable)list).AsQueryable();
	}

	private static object GenerateCollection(Type collectionType, int size, Dictionary<Type, object> createdObjectReferences)
	{
		Type type = (collectionType.IsGenericType ? collectionType.GetGenericArguments()[0] : typeof(object));
		object result = Activator.CreateInstance(collectionType);
		MethodInfo addMethod = collectionType.GetMethod("Add");
		bool areAllElementsNull = true;
		ObjectGenerator objectGenerator = new ObjectGenerator();
		for (int i = 0; i < size; i++)
		{
			object element = objectGenerator.GenerateObject(type, createdObjectReferences);
			addMethod.Invoke(result, new object[1] { element });
			areAllElementsNull = areAllElementsNull && element == null;
		}
		if (areAllElementsNull)
		{
			return null;
		}
		return result;
	}

	private static object GenerateNullable(Type nullableType, Dictionary<Type, object> createdObjectReferences)
	{
		Type type = nullableType.GetGenericArguments()[0];
		ObjectGenerator objectGenerator = new ObjectGenerator();
		return objectGenerator.GenerateObject(type, createdObjectReferences);
	}

	private static object GenerateComplexObject(Type type, Dictionary<Type, object> createdObjectReferences)
	{
		object result = null;
		if (createdObjectReferences.TryGetValue(type, out result))
		{
			return result;
		}
		if (type.IsValueType)
		{
			result = Activator.CreateInstance(type);
		}
		else
		{
			ConstructorInfo defaultCtor = type.GetConstructor(Type.EmptyTypes);
			if (defaultCtor == null)
			{
				return null;
			}
			result = defaultCtor.Invoke(new object[0]);
		}
		createdObjectReferences.Add(type, result);
		SetPublicProperties(type, result, createdObjectReferences);
		SetPublicFields(type, result, createdObjectReferences);
		return result;
	}

	private static void SetPublicProperties(Type type, object obj, Dictionary<Type, object> createdObjectReferences)
	{
		PropertyInfo[] properties = type.GetProperties(BindingFlags.Instance | BindingFlags.Public);
		ObjectGenerator objectGenerator = new ObjectGenerator();
		PropertyInfo[] array = properties;
		foreach (PropertyInfo property in array)
		{
			if (property.CanWrite)
			{
				object propertyValue = objectGenerator.GenerateObject(property.PropertyType, createdObjectReferences);
				property.SetValue(obj, propertyValue, null);
			}
		}
	}

	private static void SetPublicFields(Type type, object obj, Dictionary<Type, object> createdObjectReferences)
	{
		FieldInfo[] fields = type.GetFields(BindingFlags.Instance | BindingFlags.Public);
		ObjectGenerator objectGenerator = new ObjectGenerator();
		FieldInfo[] array = fields;
		foreach (FieldInfo field in array)
		{
			object fieldValue = objectGenerator.GenerateObject(field.FieldType, createdObjectReferences);
			field.SetValue(obj, fieldValue);
		}
	}
}
