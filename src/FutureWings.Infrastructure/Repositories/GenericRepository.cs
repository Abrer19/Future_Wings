using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Repositories;

public class GenericRepository<T>(FutureWingsDbContext context) : IGenericRepository<T>
    where T : class
{
    private readonly DbSet<T> _entities = context.Set<T>();

    public async Task<T?> GetByIdAsync(int id)
    {
        return await _entities.FindAsync(id);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync()
    {
        return await _entities.ToListAsync();
    }

    public async Task AddAsync(T entity)
    {
        await _entities.AddAsync(entity);
    }

    public void Update(T entity)
    {
        _entities.Update(entity);
    }

    public void Delete(T entity)
    {
        _entities.Remove(entity);
    }
}
