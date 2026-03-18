/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   init_free_env.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/12 15:24:51 by lraghave          #+#    #+#             */
/*   Updated: 2026/03/11 12:01:29 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

t_env		*ft_env_init(char **envp);
static int	ft_envp_init(t_env *env, char **envp, int count);
static void	init_pwd(t_env *env);
void		ft_env_free(t_env *env);
void		free_array(char **array);

/* Creates and initializes the shell's environment structure 
with a copy of system environment variables. */
t_env	*ft_env_init(char **envp)
{
	int		count;
	t_env	*env;

	count = 0;
	while (envp[count])
		count++;
	env = ft_calloc(1, sizeof(t_env));
	if (!env)
		return (NULL);
	env->envp = ft_calloc(count + 1, sizeof(char *));
	if (!env->envp)
	{
		free(env);
		return (NULL);
	}
	if (!ft_envp_init(env, envp, count))
	{
		free(env->envp);
		free(env);
		return (NULL);
	}
	init_pwd(env);
	return (env);
}

/* Copies all env variables. */
static int	ft_envp_init(t_env *env, char **envp, int count)
{
	int	i;

	i = 0;
	while (i < count)
	{
		env->envp[i] = ft_strdup(envp[i]);
		if (!env->envp[i])
		{
			i--;
			while (i >= 0)
			{
				free (env->envp[i]);
				i--;
			}
			return (0);
		}
		i++;
	}
	env->envp[count] = NULL;
	env->exit_status = 0;
	env->should_exit = 0;
	return (1);
}

/* Initializes PWD variable to ensure built-in fucntions runs well. */
static void	init_pwd(t_env *env)
{
	char	*cwd;

	cwd = getcwd(NULL, 0);
	if (cwd)
	{
		update_var(env, "PWD", cwd);
		free(cwd);
	}
}

/* Frees env structure. */
void	ft_env_free(t_env *env)
{
	int	i;

	i = 0;
	if (!env)
		return ;
	while (env->envp[i])
	{
		free(env->envp[i]);
		i++;
	}
	free(env->envp);
	free(env);
}

/* Frees any given regular array. */
void	free_array(char **array)
{
	int	i;

	i = 0;
	if (!array)
		return ;
	while (array[i] != NULL)
	{
		free(array[i]);
		i++;
	}
	free(array);
}
